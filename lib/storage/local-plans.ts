"use client"

import { z } from "zod"
import { ApiResponseSchema } from "../schema"

const StoredPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  data: ApiResponseSchema,
})
export type StoredPlan = z.infer<typeof StoredPlanSchema>

const KEY = "ai-planner:plans"

function readAll(): StoredPlan[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    const arr = Array.isArray(parsed) ? parsed : []
    const validated: StoredPlan[] = []
    for (const item of arr) {
      const r = StoredPlanSchema.safeParse(item)
      if (r.success) validated.push(r.data)
    }
    return validated
  } catch {
    return []
  }
}

function writeAll(items: StoredPlan[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(items))
}

export function savePlan(name: string, data: z.infer<typeof ApiResponseSchema>): StoredPlan {
  const all = readAll()
  const id = crypto.randomUUID()
  const stored: StoredPlan = { id, name: name.trim() || "Untitled Plan", createdAt: new Date().toISOString(), data }
  writeAll([stored, ...all])
  return stored
}

export function listPlans(): StoredPlan[] {
  return readAll()
}

export function deletePlan(id: string) {
  const all = readAll().filter((p) => p.id !== id)
  writeAll(all)
}

export function getPlan(id: string): StoredPlan | undefined {
  return readAll().find((p) => p.id === id)
}

export function exportPlan(id: string): string | null {
  const p = getPlan(id)
  if (!p) return null
  return JSON.stringify(p, null, 2)
}
