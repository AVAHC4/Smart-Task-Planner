CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY,
  goal TEXT NOT NULL,
  constraints JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  estimated_hours NUMERIC NOT NULL,
  earliest_start TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  priority TEXT,
  risk_level TEXT,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE
);
