-- ============================================================
--  MIGRACIÓN v3 — Transferencias entre cuentas (ej: apartar a ahorro)
--  Pegá TODO esto en Supabase -> SQL Editor -> New query -> Run.
--  Es IDEMPOTENTE y seguro: podés correrlo aunque ya hayas corrido v1/v2.
--  Si todavía no corriste v2, este archivo también crea las tablas.
-- ============================================================

-- 1) Tablas (por si no corriste v2). 'tipo' ahora admite 'transferencia'.
create table if not exists public.movimientos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  fecha          date not null default current_date,
  tipo           text not null check (tipo in ('ingreso', 'gasto', 'transferencia')),
  monto          numeric not null default 0,
  categoria      text,
  cuenta_id      text,            -- cuenta origen (de dónde sale / a dónde entra)
  cuenta_destino text,            -- solo en transferencias: cuenta destino
  descripcion    text,
  created_at     timestamptz not null default now()
);
create index if not exists movimientos_user_fecha_idx on public.movimientos (user_id, fecha desc);

create table if not exists public.instrumentos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  nombre         text not null,
  tipo           text,
  moneda         text not null default 'GS' check (moneda in ('GS', 'USD')),
  monto          numeric not null default 0,
  tasa_anual     numeric not null default 0,
  fecha_inicio   date default current_date,
  fecha_venc     date,
  notas          text,
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists instrumentos_user_idx on public.instrumentos (user_id);

-- 2) Para quienes YA tenían v2 sin transferencias: agregar columna y
--    permitir el nuevo tipo 'transferencia' en la restricción.
alter table public.movimientos add column if not exists cuenta_destino text;
alter table public.movimientos drop constraint if exists movimientos_tipo_check;
alter table public.movimientos
  add constraint movimientos_tipo_check check (tipo in ('ingreso', 'gasto', 'transferencia'));

-- 3) Row Level Security (idempotente)
alter table public.movimientos  enable row level security;
alter table public.instrumentos enable row level security;

drop policy if exists "mov_select_own" on public.movimientos;
create policy "mov_select_own" on public.movimientos for select using (auth.uid() = user_id);
drop policy if exists "mov_insert_own" on public.movimientos;
create policy "mov_insert_own" on public.movimientos for insert with check (auth.uid() = user_id);
drop policy if exists "mov_update_own" on public.movimientos;
create policy "mov_update_own" on public.movimientos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "mov_delete_own" on public.movimientos;
create policy "mov_delete_own" on public.movimientos for delete using (auth.uid() = user_id);

drop policy if exists "inst_select_own" on public.instrumentos;
create policy "inst_select_own" on public.instrumentos for select using (auth.uid() = user_id);
drop policy if exists "inst_insert_own" on public.instrumentos;
create policy "inst_insert_own" on public.instrumentos for insert with check (auth.uid() = user_id);
drop policy if exists "inst_update_own" on public.instrumentos;
create policy "inst_update_own" on public.instrumentos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "inst_delete_own" on public.instrumentos;
create policy "inst_delete_own" on public.instrumentos for delete using (auth.uid() = user_id);
