import { getSql } from "@/lib/db/neon"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const sql = getSql()
    const planRows = await sql `
      SELECT id, goal, constraints, created_at
      FROM plans
      WHERE id = ${params.id}
      LIMIT 1
    `
    if (!planRows.length) return new Response("Not found", { status: 404 })
    const plan = planRows[0]

    const tasks = await sql /*sql*/`
      SELECT id, title, description, owner, estimated_hours as "estimatedHours",
             earliest_start as "earliestStart", due_date as "dueDate",
             priority, risk_level as "riskLevel", status
      FROM tasks
      WHERE plan_id = ${params.id}
    `
    const deps = await sql /*sql*/`
      SELECT task_id, depends_on_task_id
      FROM task_dependencies
      WHERE task_id IN (${tasks.map((t: any) => t.id)})
    `
    const dependsMap = new Map<string, string[]>()
    for (const d of deps) {
      dependsMap.set(d.task_id, [...(dependsMap.get(d.task_id) ?? []), d.depends_on_task_id])
    }
    const tasksWithDeps = tasks.map((t: any) => ({ ...t, dependsOn: dependsMap.get(t.id) ?? [] }))
    return new Response(JSON.stringify({ plan, tasks: tasksWithDeps }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (e: any) {
    return new Response(e?.message || "DB error", { status: 500 })
  }
}
