import type { Task, Constraints } from "../schema"

function uuid() {
  return crypto.randomUUID()
}

type DraftTask = {
  title: string
  description: string
  estimatedHours: number
  dependsOnTitles: string[]
  priority?: "low" | "medium" | "high"
  riskLevel?: "low" | "medium" | "high"
}

type Graph = Map<string, Set<string>> // id -> dependencies (ids)

const DEFAULT_WORK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const DEFAULT_HOURS_PER_DAY = 8

function toWeekdayIndex(d: Date) {
  // 0 Sun ... 6 Sat
  return d.getUTCDay()
}

function isWorkday(date: Date, workDays: string[]): boolean {
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return workDays.map((d) => map[d]).includes(date.getUTCDay())
}

function startOfWorkday(date: Date) {
  const d = new Date(date)
  d.setUTCHours(9, 0, 0, 0) // 9:00 as default window start (UTC)
  return d
}

function endOfWorkday(date: Date, hoursPerDay: number) {
  const d = new Date(date)
  d.setUTCHours(9 + hoursPerDay, 0, 0, 0)
  return d
}

function addWorkingHours(start: Date, hours: number, workDays: string[], hoursPerDay: number): Date {
  let remaining = hours
  let cursor = new Date(start)

  // If before workday start, jump to start. If after, move to next workday start.
  if (!isWorkday(cursor, workDays) || cursor > endOfWorkday(cursor, hoursPerDay)) {
    // move to next workday 9:00
    do {
      cursor.setUTCDate(cursor.getUTCDate() + 1)
      cursor = startOfWorkday(cursor)
    } while (!isWorkday(cursor, workDays))
  } else if (cursor < startOfWorkday(cursor)) {
    cursor = startOfWorkday(cursor)
  }

  while (remaining > 0) {
    if (!isWorkday(cursor, workDays)) {
      // advance to next workday start
      do {
        cursor.setUTCDate(cursor.getUTCDate() + 1)
        cursor = startOfWorkday(cursor)
      } while (!isWorkday(cursor, workDays))
    }

    const workdayEnd = endOfWorkday(cursor, hoursPerDay)
    const timeLeftToday = (workdayEnd.getTime() - cursor.getTime()) / (1000 * 60 * 60)
    const consume = Math.min(remaining, timeLeftToday)

    cursor = new Date(cursor.getTime() + consume * 60 * 60 * 1000)
    remaining -= consume

    if (remaining > 0) {
      // move to next workday start
      do {
        cursor.setUTCDate(cursor.getUTCDate() + 1)
        cursor = startOfWorkday(cursor)
      } while (!isWorkday(cursor, workDays))
    }
  }

  return cursor
}

function topoSort(ids: string[], graph: Graph): { order: string[]; hasCycle: boolean } {
  const indeg = new Map<string, number>()
  ids.forEach((id) => indeg.set(id, 0))
  for (const [id, deps] of graph.entries()) {
    for (const dep of deps) {
      indeg.set(id, indeg.get(id) || 0)
      indeg.set(dep, indeg.get(dep) || 0)
    }
  }
  for (const [id, deps] of graph.entries()) {
    for (const dep of deps) {
      indeg.set(id, indeg.get(id) || 0)
      indeg.set(dep, (indeg.get(dep) || 0) + 0) // no change; we record edge as dep->id below
    }
  }

  // compute proper indegrees: count incoming edges for each node
  const incoming = new Map<string, number>(ids.map((i) => [i, 0]))
  for (const [id, deps] of graph.entries()) {
    for (const dep of deps) {
      incoming.set(id, (incoming.get(id) || 0) + 1)
    }
  }

  const q: string[] = ids.filter((id) => (incoming.get(id) || 0) === 0)
  const order: string[] = []
  while (q.length) {
    const n = q.shift()!
    order.push(n)
    for (const [child, deps] of graph.entries()) {
      if (deps.has(n)) {
        const val = (incoming.get(child) || 0) - 1
        incoming.set(child, val)
        if (val === 0) q.push(child)
      }
    }
  }
  return { order, hasCycle: order.length !== ids.length }
}

function longestPathLengths(order: string[], graph: Graph, durations: Map<string, number>): Map<string, number> {
  const dist = new Map<string, number>()
  order.forEach((id) => dist.set(id, 0))
  // For each node in topological order, relax edges to children
  for (const u of order) {
    const du = dist.get(u) || 0
    const durU = durations.get(u) || 0
    for (const [v, deps] of graph.entries()) {
      if (deps.has(u)) {
        const candidate = du + durU
        if ((dist.get(v) ?? Number.NEGATIVE_INFINITY) < candidate) {
          dist.set(v, candidate)
        }
      }
    }
  }
  return dist
}

export function scheduleDraft(
  goal: string,
  draftTasks: DraftTask[],
  constraints?: Constraints,
): {
  tasks: Task[]
  criticalPath: string[]
  feasibility: "feasible" | "tight" | "infeasible"
  notes: string[]
} {
  const workDays = constraints?.workDays ?? DEFAULT_WORK_DAYS
  const hoursPerDay = constraints?.hoursPerDay ?? DEFAULT_HOURS_PER_DAY
  const now = new Date()
  const planStart = startOfWorkday(now)

  // Build tasks and map titles -> ids
  const idByTitle = new Map<string, string>()
  const tasks: Task[] = draftTasks.map((dt) => {
    const id = uuid()
    idByTitle.set(dt.title, id)
    return {
      id,
      title: dt.title,
      description: dt.description,
      estimatedHours: Math.max(0.5, Math.min(dt.estimatedHours, 1000)),
      dependsOn: [],
      priority: dt.priority,
      riskLevel: dt.riskLevel,
    }
  })

  // Apply dependencies by matching title -> id
  const titleToTask = new Map(tasks.map((t) => [t.title, t]))
  for (const dt of draftTasks) {
    const t = titleToTask.get(dt.title)!
    t.dependsOn = (dt.dependsOnTitles || [])
      .map((title) => idByTitle.get(title))
      .filter((x): x is string => Boolean(x) && x !== t.id)
  }

  // Build dependency graph
  const graph: Graph = new Map(tasks.map((t) => [t.id, new Set<string>(t.dependsOn)]))

  // Topological order and cycle detection
  const ids = tasks.map((t) => t.id)
  const { order, hasCycle } = topoSort(ids, graph)
  const notes: string[] = []
  if (hasCycle) {
    notes.push("Detected dependency cycle(s). Removed some edges to proceed.")
    // naive cycle break: clear dependencies for any node still not in order and retry once
    // In practice, order length < ids.length signals cycles; we remove deps from nodes not in order
    const inOrder = new Set(order)
    for (const id of ids) {
      if (!inOrder.has(id)) {
        graph.set(id, new Set()) // drop deps
      }
    }
  }

  // Recompute order after potential cycle fix
  const { order: finalOrder } = topoSort(ids, graph)

  // Compute schedule using working hours
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const finishTimes = new Map<string, Date>()
  const startTimes = new Map<string, Date>()

  for (const id of finalOrder) {
    const t = byId.get(id)!
    // earliest start is max(finish(dep)) or planStart
    let earliest = new Date(planStart)
    for (const dep of graph.get(id) || []) {
      const depFinish = finishTimes.get(dep)
      if (depFinish && depFinish > earliest) earliest = depFinish
    }
    const start = earliest
    const finish = addWorkingHours(start, t.estimatedHours, workDays, hoursPerDay)
    startTimes.set(id, start)
    finishTimes.set(id, finish)
    t.earliestStart = start.toISOString()
    t.dueDate = finish.toISOString()
  }

  // Critical path: find nodes with max distance in hours
  const durations = new Map<string, number>(tasks.map((t) => [t.id, t.estimatedHours]))
  const dist = longestPathLengths(finalOrder, graph, durations)
  let maxEnd = Number.NEGATIVE_INFINITY
  let endNode: string | null = null
  for (const id of finalOrder) {
    const val = (dist.get(id) || 0) + (durations.get(id) || 0)
    if (val > maxEnd) {
      maxEnd = val
      endNode = id
    }
  }

  // Backtrack to get critical path (approx via predecessor with greatest distance)
  const criticalPath: string[] = []
  if (endNode) {
    let current = endNode
    criticalPath.unshift(current)
    while (true) {
      let bestPred: string | null = null
      let bestScore = Number.NEGATIVE_INFINITY
      for (const [v, deps] of graph.entries()) {
        if (v === current) {
          for (const pred of deps) {
            const score = (dist.get(pred) || 0) + (durations.get(pred) || 0)
            if (score > bestScore) {
              bestScore = score
              bestPred = pred
            }
          }
        }
      }
      if (bestPred && !criticalPath.includes(bestPred)) {
        criticalPath.unshift(bestPred)
        current = bestPred
      } else {
        break
      }
    }
  }
  // mark tasks on critical path
  const cpSet = new Set(criticalPath)
  for (const t of tasks) {
    t.isCritical = cpSet.has(t.id)
  }

  // Feasibility check against constraints
  let feasibility: "feasible" | "tight" | "infeasible" = "feasible"
  if (constraints?.deadline) {
    const latestFinish = [...finishTimes.values()].reduce((a, b) => (a > b ? a : b), planStart)
    const deadline = new Date(constraints.deadline)
    if (latestFinish > deadline) {
      feasibility = "infeasible"
      notes.push("Schedule exceeds the deadline. Consider scope reduction or parallelization.")
    } else {
      // if within 10% of deadline window, call it tight
      const windowHrs = (deadline.getTime() - planStart.getTime()) / (1000 * 60 * 60)
      if (
        maxEnd / (constraints.hoursPerDay ?? DEFAULT_HOURS_PER_DAY) >
        0.9 * (windowHrs / (constraints.hoursPerDay ?? DEFAULT_HOURS_PER_DAY))
      ) {
        feasibility = "tight"
      }
    }
  } else if (constraints?.timeboxDays) {
    const latestFinish = [...finishTimes.values()].reduce((a, b) => (a > b ? a : b), planStart)
    const endBox = new Date(planStart)
    endBox.setUTCDate(endBox.getUTCDate() + constraints.timeboxDays)
    if (latestFinish > endBox) {
      feasibility = "infeasible"
      notes.push("Schedule exceeds the timebox. Consider scope reduction or increased capacity.")
    }
  }

  return {
    tasks,
    criticalPath,
    feasibility,
    notes,
  }
}
