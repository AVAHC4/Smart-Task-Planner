import type { NextRequest } from "next/server"
import { PlanRequestSchema, ApiResponseSchema, type Plan } from "@/lib/schema"
import { generateDraftFromGoal } from "@/lib/ai/llm"
import { scheduleDraft } from "@/lib/schedule/engine"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = PlanRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { code: "VALIDATION_ERROR", message: "Invalid request", issues: parsed.error.issues },
        { status: 400 },
      )
    }
    const { goal, constraints } = parsed.data

    
    const draft = await generateDraftFromGoal(goal, constraints)

    
    const { tasks, criticalPath, feasibility, notes } = scheduleDraft(goal, draft.tasks, constraints)

    
    const plan: Plan = {
      id: crypto.randomUUID(),
      goal,
      constraints,
      createdAt: new Date().toISOString(),
    }

    const response = {
      plan,
      tasks,
      summary: { criticalPath, feasibility, notes },
    }

    const validated = ApiResponseSchema.parse(response)
    return Response.json(validated)
  } catch (err: any) {
    console.error("[v0] /api/plan error:", err?.message || err)
    return Response.json({ code: "LLM_OR_SCHEDULING_ERROR", message: "Failed to generate plan" }, { status: 500 })
  }
}
