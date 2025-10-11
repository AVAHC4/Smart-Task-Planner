"use client"

import { useEffect, useState } from "react"
import { listPlans, savePlan, deletePlan, getPlan, exportPlan } from "@/lib/storage/local-plans"
import type { StoredPlan } from "@/lib/storage/local-plans"
import type { ApiResponseSchema } from "@/lib/schema"
import type { z } from "zod"

type Props = {
  current?: z.infer<typeof ApiResponseSchema> | null
  onLoad: (data: z.infer<typeof ApiResponseSchema>) => void
}

export default function PlanLibrary({ current, onLoad }: Props) {
  
  const [plans, setPlans] = useState<StoredPlan[]>([])
  const [name, setName] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setPlans(listPlans())
    setMounted(true)
  }, [])

  return (
    <section className="neo-card mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Plan Library</h3>
        <div className="flex gap-2">
          <input
            aria-label="Plan name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="neo-input"
            placeholder="Name this plan"
          />
          <button
            className="neo-btn"
            disabled={!current}
            onClick={() => {
              if (!current) return
              savePlan(name || "Untitled Plan", current)
              setPlans(listPlans())
              setName("")
            }}
          >
            Save Plan
          </button>
        </div>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm">No saved plans yet.</p>
      ) : (
        <ul className="divide-y">
          {plans.map((p) => (
            <li key={p.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs opacity-70">
                  {mounted ? new Date(p.createdAt).toLocaleString() : new Date(p.createdAt).toISOString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="neo-btn"
                  onClick={() => {
                    const data = getPlan(p.id)?.data
                    if (data) onLoad(data)
                  }}
                >
                  Load
                </button>
                <button
                  className="neo-btn"
                  onClick={() => {
                    const json = exportPlan(p.id)
                    if (!json) return
                    const blob = new Blob([json], { type: "application/json" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `${p.name.replace(/\s+/g, "-").toLowerCase()}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  Export JSON
                </button>
                <button
                  className="neo-btn"
                  onClick={() => {
                    deletePlan(p.id)
                    setPlans(listPlans())
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
