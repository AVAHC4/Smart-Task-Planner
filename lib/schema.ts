import { z } from "zod"

export const ConstraintsSchema = z.object({
  deadline: z.string().datetime().optional(), 
  timeboxDays: z.number().int().positive().optional(),
  workDays: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).optional(),
  hoursPerDay: z.number().positive().max(24).optional(),
  timezone: z.string().optional(),
})

export const PlanRequestSchema = z.object({
  goal: z.string().min(4),
  constraints: ConstraintsSchema.optional(),
})

export const LlmTaskDraftSchema = z.object({
  title: z.string().min(2),
  description: z.string().default(""),
  estimatedHours: z.number().positive().max(1000),
  
  dependsOnTitles: z.array(z.string()).default([]),
  priority: z.enum(["low", "medium", "high"]).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
})

export const LlmDraftSchema = z.object({
  tasks: z.array(LlmTaskDraftSchema).min(1).max(60),
  rationale: z.string().optional(), 
})

export type Constraints = z.infer<typeof ConstraintsSchema>
export type PlanRequest = z.infer<typeof PlanRequestSchema>

export type Task = {
  id: string
  title: string
  description: string
  estimatedHours: number
  dependsOn: string[] 
  priority?: "low" | "medium" | "high"
  riskLevel?: "low" | "medium" | "high"
  earliestStart?: string 
  dueDate?: string 
  isCritical?: boolean
}

export type Plan = {
  id: string
  goal: string
  constraints?: Constraints
  createdAt: string 
}

export type PlanSummary = {
  criticalPath: string[] 
  feasibility: "feasible" | "tight" | "infeasible"
  notes: string[]
}

export const ApiResponseSchema = z.object({
  plan: z.object({
    id: z.string(),
    goal: z.string(),
    constraints: ConstraintsSchema.optional(),
    createdAt: z.string().datetime(),
  }),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      estimatedHours: z.number(),
      dependsOn: z.array(z.string()),
      priority: z.enum(["low", "medium", "high"]).optional(),
      riskLevel: z.enum(["low", "medium", "high"]).optional(),
      earliestStart: z.string().datetime().optional(),
      dueDate: z.string().datetime().optional(),
      isCritical: z.boolean().optional(),
    }),
  ),
  summary: z.object({
    criticalPath: z.array(z.string()),
    feasibility: z.enum(["feasible", "tight", "infeasible"]),
    notes: z.array(z.string()),
  }),
})
