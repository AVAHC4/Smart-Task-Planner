import type { Task } from "@/lib/schema"

export default function TasksTable({ tasks }: { tasks: Task[] }) {
  const byId: Record<string, string> = Object.fromEntries(tasks.map((t) => [t.id, t.title]))

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-2">Task</th>
            <th className="text-left p-2">Estimate (h)</th>
            <th className="text-left p-2">Start</th>
            <th className="text-left p-2">Due</th>
            <th className="text-left p-2">Depends On</th>
            <th className="text-left p-2">Critical</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="border-t">
              <td className="p-2">
                <div className="font-medium">{t.title}</div>
                {t.description ? <div className="text-muted-foreground">{t.description}</div> : null}
              </td>
              <td className="p-2">{t.estimatedHours}</td>
              <td className="p-2">{t.earliestStart ? new Date(t.earliestStart).toLocaleString() : "-"}</td>
              <td className="p-2">{t.dueDate ? new Date(t.dueDate).toLocaleString() : "-"}</td>
              <td className="p-2">
                <div className="flex flex-wrap gap-1">
                  {t.dependsOn.map((id) => (
                    <span key={id} className="px-2 py-0.5 rounded bg-muted text-foreground">
                      {byId[id] || id}
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-2">
                {t.isCritical ? (
                  <span className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground">Yes</span>
                ) : (
                  "No"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
