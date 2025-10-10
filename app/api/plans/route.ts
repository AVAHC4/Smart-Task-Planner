import type { NextRequest } from "next/server"
import { getSql } from "@/lib/db/neon"
import { ApiResponseSchema } from "@/lib/schema"

export async function GET() {
  try {
    const sql = getSql()
    const rows = await sql /*sql*/`
      SELECT p.id, p.goal, p.constraints, p.created_at
      FROM plans p
      ORDER BY p.created_at DESC
      LIMIT 50
    `
    return new Response(JSON.stringify(rows), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (e: any) {
    return new Response(e?.message || "DB error", { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const data = ApiResponseSchema.parse(payload)
    const sql = getSql()
    await sql /*sql*/`
      INSERT INTO plans (id, goal, constraints, created_at)
      VALUES (${data.plan.id}, ${data.plan.goal}, ${JSON.stringify(data.plan.constraints)}, ${data.plan.createdAt})
    `
    // tasks
    for (const t of data.tasks) {
      await sql /*sql*/`
        INSERT INTO tasks (id, plan_id, title, description, owner, estimated_hours, earliest_start, due_date, priority, risk_level, status)
        VALUES (${t.id}, ${data.plan.id}, ${t.title}, ${t.description ?? null}, ${t.owner ?? null}, ${t.estimatedHours}, ${t.earliestStart ?? null}, ${t.dueDate ?? null}, ${t.priority ?? null}, ${t.riskLevel ?? null}, ${t.status})
      `
      for (const dep of t.dependsOn) {
        await sql /*sql*/`
          INSERT INTO task_dependencies (task_id, depends_on_task_id)
          VALUES (${t.id}, ${dep})
        `
      }
    }
    return new Response(JSON.stringify({ ok: true }), { status: 201 })
  } catch (e: any) {
    return new Response(e?.message || "DB error", { status: 400 })
  }
}
