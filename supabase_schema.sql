-- ============================================================
--  Esquema de base de datos para "Presupuesto & Patrimonio"
--  Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- ----- Tabla CONFIG (una fila por usuario) -----
create table if not exists public.config (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ----- Tabla MESES (una fila por período por usuario) -----
create table if not exists public.meses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  periodo    text not null,                 -- formato "YYYY-MM"
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, periodo)
);

create index if not exists meses_user_periodo_idx on public.meses (user_id, periodo);

-- ============================================================
--  ROW LEVEL SECURITY: cada usuario solo ve / edita SUS datos
-- ============================================================
alter table public.config enable row level security;
alter table public.meses  enable row level security;

-- Políticas para CONFIG
drop policy if exists "config_select_own" on public.config;
create policy "config_select_own" on public.config
  for select using (auth.uid() = user_id);

drop policy if exists "config_insert_own" on public.config;
create policy "config_insert_own" on public.config
  for insert with check (auth.uid() = user_id);

drop policy if exists "config_update_own" on public.config;
create policy "config_update_own" on public.config
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "config_delete_own" on public.config;
create policy "config_delete_own" on public.config
  for delete using (auth.uid() = user_id);

-- Políticas para MESES
drop policy if exists "meses_select_own" on public.meses;
create policy "meses_select_own" on public.meses
  for select using (auth.uid() = user_id);

drop policy if exists "meses_insert_own" on public.meses;
create policy "meses_insert_own" on public.meses
  for insert with check (auth.uid() = user_id);

drop policy if exists "meses_update_own" on public.meses;
create policy "meses_update_own" on public.meses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "meses_delete_own" on public.meses;
create policy "meses_delete_own" on public.meses
  for delete using (auth.uid() = user_id);

-- ============================================================
--  Trigger para mantener updated_at al día
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists config_set_updated_at on public.config;
create trigger config_set_updated_at before update on public.config
  for each row execute function public.set_updated_at();

drop trigger if exists meses_set_updated_at on public.meses;
create trigger meses_set_updated_at before update on public.meses
  for each row execute function public.set_updated_at();
