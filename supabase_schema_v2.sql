-- ============================================================
--  MIGRACIÓN v2 — Registro por transacción + Instrumentos financieros
--  Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run
--  (Es seguro correrlo aunque ya hayas corrido el schema v1.)
-- ============================================================

-- ----- MOVIMIENTOS: un registro por cada ingreso o gasto -----
create table if not exists public.movimientos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  fecha       date not null default current_date,
  tipo        text not null check (tipo in ('ingreso', 'gasto')),
  monto       numeric not null default 0,
  categoria   text,
  cuenta_id   text,                          -- id de la cuenta (sobre) en config
  descripcion text,
  created_at  timestamptz not null default now()
);
create index if not exists movimientos_user_fecha_idx on public.movimientos (user_id, fecha desc);

-- ----- INSTRUMENTOS: plazo fijo, bonos, cripto, etc. -----
create table if not exists public.instrumentos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  nombre         text not null,
  tipo           text,                       -- "Plazo fijo", "Bono", "Cripto"...
  moneda         text not null default 'GS' check (moneda in ('GS', 'USD')),
  monto          numeric not null default 0, -- capital invertido (en su moneda)
  tasa_anual     numeric not null default 0, -- fracción: 0.055 = 5,5%
  fecha_inicio   date default current_date,
  fecha_venc     date,                       -- vencimiento (opcional)
  notas          text,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists instrumentos_user_idx on public.instrumentos (user_id);

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table public.movimientos enable row level security;
alter table public.instrumentos enable row level security;

-- Movimientos
drop policy if exists "mov_select_own" on public.movimientos;
create policy "mov_select_own" on public.movimientos for select using (auth.uid() = user_id);
drop policy if exists "mov_insert_own" on public.movimientos;
create policy "mov_insert_own" on public.movimientos for insert with check (auth.uid() = user_id);
drop policy if exists "mov_update_own" on public.movimientos;
create policy "mov_update_own" on public.movimientos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "mov_delete_own" on public.movimientos;
create policy "mov_delete_own" on public.movimientos for delete using (auth.uid() = user_id);

-- Instrumentos
drop policy if exists "inst_select_own" on public.instrumentos;
create policy "inst_select_own" on public.instrumentos for select using (auth.uid() = user_id);
drop policy if exists "inst_insert_own" on public.instrumentos;
create policy "inst_insert_own" on public.instrumentos for insert with check (auth.uid() = user_id);
drop policy if exists "inst_update_own" on public.instrumentos;
create policy "inst_update_own" on public.instrumentos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "inst_delete_own" on public.instrumentos;
create policy "inst_delete_own" on public.instrumentos for delete using (auth.uid() = user_id);
