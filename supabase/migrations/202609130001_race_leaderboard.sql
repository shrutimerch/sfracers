create table if not exists public.race_times (
  id uuid primary key,
  course text not null check (course = 'south-park-waterfront-v1-1lap'),
  name text not null check (char_length(trim(name)) between 1 and 20),
  x_handle text check (x_handle ~ '^[A-Za-z0-9_]{1,15}$'),
  time_ms integer not null check (time_ms between 20000 and 3600000),
  character text not null check (character in ('chonkers','karl','daniel','waymo','sam','dario','elon','mark','garry','pejman','andrew','aditya')),
  position smallint not null check (position between 1 and 4),
  created_at timestamptz not null default now()
);
create index if not exists race_times_fastest on public.race_times (course, time_ms, created_at, id);
alter table public.race_times enable row level security;
revoke all on public.race_times from anon, authenticated;
grant select on public.race_times to anon, authenticated;
grant insert (id, course, name, x_handle, time_ms, character, position) on public.race_times to anon, authenticated;
create policy "Read public race times" on public.race_times for select to anon, authenticated using (true);
create policy "Submit finished race times" on public.race_times for insert to anon, authenticated with check (course = 'south-park-waterfront-v1-1lap');
