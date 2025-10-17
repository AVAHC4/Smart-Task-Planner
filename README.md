# AI Smart Task Planner

Convert goals like "Launch a product in 2 weeks" into a structured plan with actionable tasks, dependencies, and a realistic timeline.

- LLM for task decomposition and rough estimates (AI SDK v5).
- Deterministic scheduler for dates, feasibility, and critical path.
- Optional persistence (add Postgres later).
- Minimal frontend to submit goals and visualize the plan (table + timeline).

## Features

- Structured LLM output (Zod-validated) to prevent JSON drift.
- Topological sort with cycle handling; critical path detection.
- Working-hours calendar (Mon–Fri, 8h/day by default).
- API-first: POST /api/plan.
- Accessible, mobile-first UI with a simple Gantt-like chart.
- Front-end Plan Library to save, load, export, and delete plans.
- Theme Customization (Neo-Brutalism) with 3 presets or custom colors.

## Tech

- Next.js App Router
- AI SDK v5 (`generateObject`)
- Zod
- Recharts (timeline)
- TypeScript

## Getting Started

- Open the preview and click Generate Plan on the homepage.
- Edit goal, deadline/timebox, work days, and hours/day as needed.
- Use the Theme panel to customize the UI appearance.

Publish to Vercel from v0, or download ZIP and push to GitHub via v0.

## API

POST /api/plan

Body:
{
  "goal": "Launch a product in 2 weeks",
  "constraints": {
    "deadline": "2025-10-31T17:00:00.000Z",
    "timeboxDays": 14,
    "workDays": ["Mon","Tue","Wed","Thu","Fri"],
    "hoursPerDay": 8,
    "timezone": "UTC"
  }
}

Response:
{
  "plan": { "id": "...", "goal": "...", "constraints": {...}, "createdAt": "..." },
  "tasks": [
    {
      "id": "...",
      "title": "...",
      "description": "...",
      "estimatedHours": 12,
      "dependsOn": ["..."],
      "earliestStart": "...",
      "dueDate": "...",
      "isCritical": true
    }
  ],
  "summary": {
    "criticalPath": ["..."],
    "feasibility": "feasible|tight|infeasible",
    "notes": ["..."]
  }
}

Error codes:
- VALIDATION_ERROR, LLM_OR_SCHEDULING_ERROR

## Persistence (Optional)

This demo is stateless by default. To add Postgres:
- Use Neon with `@neondatabase/serverless` and a `DATABASE_URL`.
- Tables: plans, tasks, task_dependencies.
- Add endpoints: /api/plans (POST/GET), /api/plans/[id] (GET).
- Follow the "Neon Integration Guidelines" if you enable it later.



## Notes and Limits

- Estimates are heuristics; adjust hours/day and work days to match reality.
- Dependency cycles are auto-resolved conservatively; consider revising tasks.
- Timezone support is normalized to ISO strings; display uses local time in UI.
- Theme customization changes are persisted locally using CSS variables.
