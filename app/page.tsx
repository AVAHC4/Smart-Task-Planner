"use client"

import { useState } from "react"
import GoalForm from "@/components/goal-form"
import PlanSummary from "@/components/plan-summary"
import TasksTable from "@/components/tasks-table"
import PlanTimeline from "@/components/plan-timeline"
import PlanLibrary from "@/components/plan-library"
import ThemeCustomizer from "@/components/theme-customizer"

export default function Page() {
  const [result, setResult] = useState<any | null>(null)

  const taskTitlesById: Record<string, string> = result?.tasks
    ? Object.fromEntries(result.tasks.map((t: any) => [t.id, t.title]))
    : {}

  return (
    <main className="min-h-screen w-full flex flex-col items-center px-4 py-8 gap-6 font-sans">
      <header className="w-full max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-pretty">AI Smart Task Planner</h1>
            <p className="text-muted-foreground mt-1">Translate goals into actionable, scheduled task plans.</p>
          </div>
          <ThemeCustomizer />
        </div>
      </header>

      <section className="w-full max-w-5xl">
        <GoalForm onResult={setResult} />
      </section>

      {result && (
        <section className="w-full max-w-5xl grid grid-cols-1 gap-4">
          <PlanSummary summary={result.summary} taskTitlesById={taskTitlesById} />
          <PlanTimeline tasks={result.tasks} />
          <TasksTable tasks={result.tasks} />
        </section>
      )}

      <section className="w-full max-w-5xl">
        <PlanLibrary current={result} onLoad={(data) => setResult(data)} />
      </section>

      <footer className="w-full max-w-5xl text-xs text-muted-foreground mt-8">
        <p>
          Note: This demo uses structured LLM output plus a deterministic scheduler (DAG validation, working-hours
          calendar, and critical path).
        </p>
      </footer>
    </main>
  )
}
