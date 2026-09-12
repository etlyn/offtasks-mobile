create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  "isComplete" boolean not null default false,
  date date,
  priority integer not null default 0,
  target_group text not null default 'today' check(target_group in ('today','tomorrow','upcoming','close')),
  inserted_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
grant select, insert, update, delete on public.tasks to authenticated;
create policy "Own tasks" on public.tasks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());