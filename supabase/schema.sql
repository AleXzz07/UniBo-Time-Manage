-- UniBo Planner - Supabase schema
-- Esegui tutto nel Supabase SQL Editor.

create table if not exists public.users (
  id text primary key,
  name text not null default 'Studente',
  university text not null default 'Università di Bologna',
  course_id text not null,
  course_name text not null,
  academic_year text not null default '2026/2027',
  year_of_course integer not null default 1,
  curriculum text,
  "group" text,
  onboarded boolean not null default true,
  created_at text not null
);

create table if not exists public.lesson_events (
  id text primary key,
  stable_id text not null,
  course_id text not null,
  cod_modulo text not null,
  subject_key text not null,
  subject_name text not null,
  docente text,
  date text not null,
  start text not null,
  "end" text not null,
  start_time text not null,
  end_time text not null,
  aula text,
  edificio text,
  indirizzo text,
  piano text,
  campus text not null default 'Bologna',
  gruppo text,
  teledidattica boolean not null default false,
  cfu double precision,
  note text,
  color_token text not null default 'subjectCAD',
  source_url text not null,
  last_updated text not null,
  unique(course_id, stable_id)
);

create table if not exists public.subjects (
  id text primary key,
  course_id text not null,
  subject_key text not null,
  name text not null,
  docente text,
  color_token text not null default 'subjectCAD',
  cfu double precision,
  exam_date text,
  planned_hours double precision not null default 30,
  completed_minutes integer not null default 0,
  topics jsonb not null default '[]'::jsonb,
  attended boolean not null default true,
  updated_at text not null,
  unique(course_id, subject_key)
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  subject_key text,
  subject_name text,
  color_token text,
  due_date text,
  estimated_minutes integer not null default 60,
  priority text not null default 'medium',
  status text not null default 'todo',
  notes text,
  created_at text not null,
  updated_at text not null,
  completed_at text,
  deleted_at text
);

create table if not exists public.study_sessions (
  id text primary key,
  subject_key text,
  subject_name text,
  color_token text,
  date text not null,
  start text not null,
  "end" text not null,
  planned_minutes integer not null default 90,
  completed boolean not null default false,
  notes text,
  source text not null default 'manual',
  created_at text not null,
  deleted_at text
);

create table if not exists public.personal_events (
  id text primary key,
  title text not null,
  date text not null,
  start text not null,
  "end" text not null,
  notes text,
  created_at text not null,
  deleted_at text
);

create table if not exists public.schedule_changes (
  id text primary key,
  course_id text not null,
  type text not null,
  subject_name text not null,
  subject_key text,
  date text not null,
  message text not null,
  old_value text,
  new_value text,
  detected_at text not null,
  read boolean not null default false
);

create table if not exists public.sync_status (
  id text primary key,
  course_id text not null unique,
  status text not null default 'ok',
  last_sync text,
  last_success text,
  source_url text,
  message text,
  event_count integer not null default 0,
  updated_at text not null
);

create index if not exists idx_lessons_course_date
  on public.lesson_events(course_id, date);

create index if not exists idx_tasks_due_date
  on public.tasks(due_date);

create index if not exists idx_study_sessions_date
  on public.study_sessions(date);

create index if not exists idx_personal_events_date
  on public.personal_events(date);

create index if not exists idx_schedule_changes_course
  on public.schedule_changes(course_id, detected_at);

-- The app talks to Supabase only from the trusted FastAPI backend with a secret key.
-- Lock direct anon/authenticated access by enabling RLS without public policies.
alter table public.users enable row level security;
alter table public.lesson_events enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.study_sessions enable row level security;
alter table public.personal_events enable row level security;
alter table public.schedule_changes enable row level security;
alter table public.sync_status enable row level security;

grant all on public.users to service_role;
grant all on public.lesson_events to service_role;
grant all on public.subjects to service_role;
grant all on public.tasks to service_role;
grant all on public.study_sessions to service_role;
grant all on public.personal_events to service_role;
grant all on public.schedule_changes to service_role;
grant all on public.sync_status to service_role;
