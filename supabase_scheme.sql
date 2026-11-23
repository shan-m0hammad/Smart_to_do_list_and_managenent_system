create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_date date,
  category text default '',
  reminder text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
alter table public.tasks enable row level security;

drop policy if exists "Users can view their own tasks" on public.tasks;
drop policy if exists "Users can insert their own tasks" on public.tasks;
drop policy if exists "Users can update their own tasks" on public.tasks;
drop policy if exists "Users can delete their own tasks" on public.tasks;

create policy "Users can view their own tasks" on public.tasks
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own tasks" on public.tasks
for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on public.tasks
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own tasks" on public.tasks
for delete to authenticated using (auth.uid() = user_id);

notify pgrst, 'reload schema';
