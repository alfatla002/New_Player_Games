-- Run once in the Supabase SQL editor. Enable anonymous sign-ins in Auth settings.
create table public.tasks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 title text not null check (length(trim(title)) between 1 and 160),
 description text not null default '' check (length(description) <= 5000),
 status text not null default 'todo' check (status in ('todo','in_progress','in_review','done')),
 priority text not null default 'normal' check (priority in ('low','normal','high')),
 due_date date,
 labels text[] not null default '{}',
 created_at timestamptz not null default now()
);
create index tasks_owner_created on public.tasks(user_id, created_at);
alter table public.tasks enable row level security;
revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;
create policy "Read own tasks" on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own tasks" on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own tasks" on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own tasks" on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);
