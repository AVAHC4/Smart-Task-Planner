export default function PlanSummary({
  summary,
  taskTitlesById,
}: {
  summary: { feasibility: "feasible" | "tight" | "infeasible"; criticalPath: string[]; notes: string[] }
  taskTitlesById: Record<string, string>
}) {
  const color =
    summary.feasibility === "feasible"
      ? "bg-green-100 text-green-900"
      : summary.feasibility === "tight"
        ? "bg-yellow-100 text-yellow-900"
        : "bg-red-100 text-red-900"

  return (
    <div className={`w-full rounded-md border p-4 ${color}`} role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Feasibility: {summary.feasibility}</h3>
      </div>
      <div className="mt-2">
        <div className="text-sm font-medium">Critical path</div>
        <div className="flex flex-wrap gap-2 mt-1">
          {summary.criticalPath.map((id) => (
            <span key={id} className="px-2 py-0.5 rounded bg-foreground text-background text-xs">
              {taskTitlesById[id] || id}
            </span>
          ))}
        </div>
      </div>
      {summary.notes?.length ? (
        <ul className="list-disc pl-5 mt-3 text-sm">
          {summary.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
