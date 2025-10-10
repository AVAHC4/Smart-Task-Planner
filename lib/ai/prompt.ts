export const SYSTEM_PROMPT = `
You are an expert project/program manager.
Your job: break down a user goal into actionable tasks with pragmatic time estimates and explicit dependencies.

Rules:
- Output STRICT JSON only, no prose, matching the schema provided.
- Prefer 8–25 tasks unless the goal is trivial.
- Task titles should be concise and unique.
- estimatedHours is a realistic duration a single focused contributor would spend.
- dependsOnTitles is a list of task titles (strings).
- Avoid cycles; use clear DAG-like dependencies.
- Group related work sequentially when necessary.
- Keep "rationale" concise (bullet-style notes).
`

export function buildUserPrompt(
  goal: string,
  constraints?: {
    deadline?: string
    timeboxDays?: number
    workDays?: string[]
    hoursPerDay?: number
    timezone?: string
  },
) {
  const parts = [
    `Goal: ${goal}`,
    constraints?.deadline ? `Deadline: ${constraints.deadline}` : "",
    constraints?.timeboxDays ? `Timebox (days): ${constraints.timeboxDays}` : "",
    constraints?.workDays?.length ? `Work days: ${constraints.workDays.join(", ")}` : "",
    constraints?.hoursPerDay ? `Hours/day: ${constraints.hoursPerDay}` : "",
    constraints?.timezone ? `Timezone: ${constraints.timezone}` : "",
  ].filter(Boolean)

  return `
Break down this goal into actionable tasks with suggested dependencies and realistic estimatedHours.
Favor clarity, avoid redundancy, and ensure a directed acyclic dependency graph.

Context:
${parts.join("\n")}

Output JSON fields:
{
  "tasks": Array<{
    "title": string,
    "description": string,
    "estimatedHours": number,
    "dependsOnTitles": string[],
    "priority"?: "low"|"medium"|"high",
    "riskLevel"?: "low"|"medium"|"high"
  }>,
  "rationale"?: string
}
`.trim()
}
