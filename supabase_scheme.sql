-- SmartTask database schema for storing each user's tasks in Supabase.

-- Creates the tasks table only if it does not already exist.
create table if not exists public.tasks (
  id text primary key, -- Unique task identifier used by the application.
  user_id uuid not null references auth.users(id) on delete cascade, -- Links each task to its owner; deleting the user also deletes their tasks.
  title text not null, -- Stores the task title; a title is required.
  description text default '', -- Stores an optional task description; defaults to an empty string.
  priority text not null default 'medium' check (priority in ('low','medium','high')), -- Allows only low, medium, or high priority.
  due_date date, -- Stores the task's due date.
  category text default '', -- Stores an optional task category.
  reminder text, -- Stores optional reminder information.
  completed boolean not null default false, -- Tracks whether the task is completed; new tasks are pending by default.
  completed_at timestamptz, -- Stores the date and time when the task was completed.
  created_at timestamptz not null default now() -- Automatically stores the creation timestamp.
);

-- Creates an index on user_id to help queries that retrieve one user's tasks.
create index if not exists tasks_user_id_idx on public.tasks(user_id);

-- Enables Row Level Security (RLS) on the tasks table.
alter table public.tasks enable row level security;

-- Removes the previous versions of these policies, if they exist.
-- This makes the policy setup safe to run again.
drop policy if exists "Users can view their own tasks" on public.tasks;
drop policy if exists "Users can insert their own tasks" on public.tasks;
drop policy if exists "Users can update their own tasks" on public.tasks;
drop policy if exists "Users can delete their own tasks" on public.tasks;

-- Allows authenticated users to read only rows where they are the owner.
create policy "Users can view their own tasks" on public.tasks
for select to authenticated using (auth.uid() = user_id);

-- Allows authenticated users to insert tasks only for their own user ID.
create policy "Users can insert their own tasks" on public.tasks
for insert to authenticated with check (auth.uid() = user_id);

-- Allows authenticated users to update only their own tasks.
-- USING checks which existing rows they may update.
-- WITH CHECK ensures the updated row still belongs to them.
create policy "Users can update their own tasks" on public.tasks
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Allows authenticated users to delete only their own tasks.
create policy "Users can delete their own tasks" on public.tasks
for delete to authenticated using (auth.uid() = user_id);

-- Notifies the PostgREST service to reload its schema cache.
notify pgrst, 'reload schema';
