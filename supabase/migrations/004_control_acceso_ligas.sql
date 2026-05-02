-- ============================================================
-- GolStreet — Control de acceso a ligas (invitaciones)
-- ============================================================

-- 1. Agregar campos de control de acceso al tenant
alter table public.tenants
  add column if not exists modo_acceso       text not null default 'abierto'
    check (modo_acceso in ('abierto', 'invitacion')),
  add column if not exists inscripciones_abiertas boolean not null default true,
  add column if not exists max_jugadores     integer default null;

comment on column public.tenants.modo_acceso is
  'abierto = cualquiera con el código puede unirse; invitacion = solo emails de la tabla invitaciones';
comment on column public.tenants.inscripciones_abiertas is
  'El admin puede cerrar la puerta cuando todos los invitados ya ingresaron';
comment on column public.tenants.max_jugadores is
  'Límite opcional de jugadores. null = sin límite';

-- 2. Tabla de invitaciones por email
create table if not exists public.invitaciones (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  email       text not null,
  nombre      text,                           -- nombre visible para el admin
  usado       boolean not null default false, -- true cuando el usuario ya se unió
  usado_por   uuid references public.profiles(id),
  usado_en    timestamptz,
  creado_en   timestamptz not null default now(),
  unique (tenant_id, email)                   -- no duplicados por liga
);

-- Índice para búsqueda rápida por tenant + email
create index if not exists idx_invitaciones_tenant_email
  on public.invitaciones(tenant_id, lower(email));

-- RLS: el admin del tenant puede gestionar sus invitaciones
alter table public.invitaciones enable row level security;

-- El admin del tenant puede leer y escribir sus invitaciones
create policy "Admin puede gestionar invitaciones de su liga"
  on public.invitaciones
  for all
  using (
    exists (
      select 1 from public.tenant_members tm
      where tm.tenant_id = invitaciones.tenant_id
        and tm.user_id = auth.uid()
        and tm.rol = 'admin'
    )
  );

-- El service role puede hacer todo (para el API de onboarding)
-- (el service role bypassa RLS por defecto en Supabase)

-- 3. Vista útil para el admin: cuántos han entrado vs invitados
create or replace view public.v_resumen_invitaciones as
select
  t.id        as tenant_id,
  t.nombre    as liga,
  t.modo_acceso,
  t.inscripciones_abiertas,
  t.max_jugadores,
  count(i.id)                              as total_invitados,
  count(i.id) filter (where i.usado)       as ya_ingresaron,
  count(i.id) filter (where not i.usado)   as pendientes
from public.tenants t
left join public.invitaciones i on i.tenant_id = t.id
group by t.id, t.nombre, t.modo_acceso, t.inscripciones_abiertas, t.max_jugadores;
