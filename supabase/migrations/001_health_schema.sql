-- Enable extension for UUID generation if needed
create extension if not exists "pgcrypto";

-- Daily health metrics (per user per date)
create table if not exists public.daily_metrics (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  recovery integer,
  feeling numeric(3, 1),
  sleep numeric(3, 1),
  hrv integer,
  resting_hr integer,
  active_minutes integer,
  steps integer,
  weight numeric(5, 1),
  strain numeric(4, 1),
  active_energy integer,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists daily_metrics_user_id_idx
  on public.daily_metrics (user_id);

create index if not exists daily_metrics_date_idx
  on public.daily_metrics (date);

-- Progress pictures metadata
create table if not exists public.progress_pictures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  view text not null check (view in ('front', 'side', 'back')),
  notes text,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists progress_pictures_user_id_idx
  on public.progress_pictures (user_id);

create index if not exists progress_pictures_date_idx
  on public.progress_pictures (date);

-- Updated_at trigger for daily_metrics
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_daily_metrics_updated_at on public.daily_metrics;
create trigger set_daily_metrics_updated_at
before update on public.daily_metrics
for each row execute function public.set_updated_at();

-- RLS
alter table public.daily_metrics enable row level security;
alter table public.progress_pictures enable row level security;

create policy "daily_metrics_select_own"
  on public.daily_metrics for select
  using (auth.uid() = user_id);

create policy "daily_metrics_insert_own"
  on public.daily_metrics for insert
  with check (auth.uid() = user_id);

create policy "daily_metrics_update_own"
  on public.daily_metrics for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "daily_metrics_delete_own"
  on public.daily_metrics for delete
  using (auth.uid() = user_id);

create policy "progress_pictures_select_own"
  on public.progress_pictures for select
  using (auth.uid() = user_id);

create policy "progress_pictures_insert_own"
  on public.progress_pictures for insert
  with check (auth.uid() = user_id);

create policy "progress_pictures_delete_own"
  on public.progress_pictures for delete
  using (auth.uid() = user_id);
