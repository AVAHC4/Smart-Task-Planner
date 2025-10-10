"use client"

import { useState } from "react"

type ConstraintsInput = {
  deadline?: string
  timeboxDays?: number
  workDays?: string[]
  hoursPerDay?: number
  timezone?: string
}

export default function GoalForm({
  onResult,
}: {
  onResult: (data: any) => void
}) {
  const [goal, setGoal] = useState("Launch a product in 2 weeks")
  const [deadline, setDeadline] = useState<string>("")
  const [timeboxDays, setTimeboxDays] = useState<number>(14)
  const [hoursPerDay, setHoursPerDay] = useState<number>(8)
  const [workDays, setWorkDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleWorkDay = (day: string) => {
    setWorkDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  async function submit() {
    setLoading(true)
    setError(null)
    try {
      const normalizedDeadline = deadline ? new Date(deadline).toISOString() : undefined

      const constraints: ConstraintsInput = {
        deadline: normalizedDeadline,
        timeboxDays: timeboxDays || undefined,
        hoursPerDay: hoursPerDay || undefined,
        workDays,
      }

      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, constraints }),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error(msg.message || "Request failed")
      }
      const data = await res.json()
      onResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-md border p-4 bg-card text-card-foreground">
      <h2 className="text-xl font-semibold mb-3 text-pretty">Smart Task Planner</h2>
      <label className="block text-sm font-medium mb-1">Goal</label>
      <textarea
        className="w-full border rounded p-2 mb-3"
        rows={3}
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="e.g., Launch a product in 2 weeks"
        aria-label="Goal"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Deadline (optional)</label>
          <input
            type="datetime-local"
            className="w-full border rounded p-2"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            aria-label="Deadline"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Timebox days (optional)</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={timeboxDays}
            onChange={(e) => setTimeboxDays(Number(e.target.value))}
            aria-label="Timebox days"
            min={1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hours per day</label>
          <input
            type="number"
            className="w-full border rounded p-2"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            aria-label="Hours per day"
            min={1}
            max={24}
          />
        </div>
        <div>
          <fieldset>
            <legend className="block text-sm font-medium mb-1">Work days</legend>
            <div className="flex flex-wrap gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleWorkDay(d)}
                  aria-pressed={workDays.includes(d)}
                  className={`px-2 py-1 rounded border ${
                    workDays.includes(d) ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
      {error && (
        <p className="text-red-600 mt-2" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4">
        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </div>
      <p className="sr-only">Primary color used for action button; accessible contrast ensured.</p>
    </div>
  )
}
