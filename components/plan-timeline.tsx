"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Task } from "@/lib/schema"

type Row = {
  name: string
  duration: number 
}

export default function PlanTimeline({ tasks }: { tasks: Task[] }) {
  if (!tasks?.length) return null

  
  const starts = tasks.map((t) => (t.earliestStart ? new Date(t.earliestStart).getTime() : Number.POSITIVE_INFINITY))
  const minStartMs = Math.min(...starts)
  const planStart = isFinite(minStartMs) ? minStartMs : Date.now()

  const rows: Row[] = tasks.map((t) => {
    const startMs = t.earliestStart ? new Date(t.earliestStart).getTime() : planStart
    const endMs = t.dueDate ? new Date(t.dueDate).getTime() : startMs
    const durationH = Math.max(0, (endMs - startMs) / (1000 * 60 * 60))
    return {
      name: t.title,
      duration: Number(durationH.toFixed(2)),
    }
  })

  return (
    <div className="w-full rounded-md border p-2" style={{ height: Math.max(360, rows.length * 32) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" barCategoryGap={8} margin={{ left: 16, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, "dataMax"]} label={{ value: "Duration (hours)", position: "insideBottomRight", offset: -4 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={220}
            interval={0}
            tickLine={false}
            tick={{ fontSize: 12 }}
            tickFormatter={(v: any) => (typeof v === "string" && v.length > 40 ? `${v.slice(0, 37)}…` : String(v))}
          />
          <Tooltip />
          <Bar dataKey="duration" fill="var(--color-primary)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
