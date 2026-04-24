-- ============================================================
-- GolStreet — Schema inicial de Supabase
-- Multi-tenant: Wall Street del Mundial FIFA 2026
-- ============================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ============================================================
-- TABLA: tenants
-- Un tenant = una empresa o grupo que crea su propio mercado
-- ============================================================
create table if not exists public.tenants (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  slug            text not null unique,
  email_admin     text not null,
  plan            text not null default 'gratuito' check (plan in ('gratuito', 'pro', 'enterprise')),
  pozo_monto      numeric(12,2) default 0,
  pozo_distribucion jsonb default '[
    {"posicion": 1, "porcentaje": 45},
    {"posicion": 2, "porcentaje": 25},
    {"posicion": 3, "porcentaje": 15},
    {"posicion": 4, "porcentaje": 5},
    {"fondo_liga": true, "porcentaje": 10}
  ]'::jsonb,
  coins_iniciales numeric(12,2) default 10000,
  entrada_tardia  jsonb default '{
    "antes_octavos": 7000,
    "antes_cuartos": 5000,
    "semis_adelante": null
  }'::jsonb,
  pantalla_publica_activa boolean default true,
  modo_pantalla   text default 'mercado' check (modo_pantalla in ('mercado', 'partido', 'ranking')),
  mercado_activo  boolean default true,
  fecha_creacion  timestamptz default now()
);

-- ============================================================
-- TABLA: teams (GLOBAL — no por tenant)
-- Selecciones nacionales del torneo
-- ============================================================
create table if not exists public.teams (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  codigo_pais     text not null unique,
  bandera_url     text,
  precio_base     numeric(10,2) not null,
  precio_ipo      numeric(10,2) not null,
  factor_riesgo   text not null default 'medio' check (factor_riesgo in ('bajo', 'medio', 'alto', 'muy_alto')),
  coeficiente_volatilidad numeric(4,3) default 1.0,
  acciones_total  integer not null default 1000000,
  fase_actual     text default 'grupos' check (fase_actual in ('grupos', 'octavos', 'cuartos', 'semis', 'final', 'eliminado')),
  eliminado       boolean default false,
  fecha_eliminacion timestamptz
);

-- Datos iniciales de selecciones FIFA 2026
insert into public.teams (nombre, codigo_pais, bandera_url, precio_base, precio_ipo, factor_riesgo, coeficiente_volatilidad, acciones_total) values
  ('Francia',     'FRA', 'https://flagcdn.com/fr.svg', 1500, 1500, 'bajo',     0.80, 1000000),
  ('España',      'ESP', 'https://flagcdn.com/es.svg', 1450, 1450, 'bajo',     0.82, 1000000),
  ('Argentina',   'ARG', 'https://flagcdn.com/ar.svg', 1400, 1400, 'medio',    1.00, 1000000),
  ('Brasil',      'BRA', 'https://flagcdn.com/br.svg', 1350, 1350, 'medio',    1.05, 1000000),
  ('Inglaterra',  'ENG', 'https://flagcdn.com/gb-eng.svg', 1300, 1300, 'medio', 1.00, 1000000),
  ('Colombia',    'COL', 'https://flagcdn.com/co.svg', 850,  850,  'alto',     1.40, 1000000),
  ('Marruecos',   'MAR', 'https://flagcdn.com/ma.svg', 800,  800,  'alto',     1.45, 1000000),
  ('Japón',       'JPN', 'https://flagcdn.com/jp.svg', 600,  600,  'alto',     1.50, 1000000),
  ('Nigeria',     'NGA', 'https://flagcdn.com/ng.svg', 500,  500,  'alto',     1.55, 1000000),
  ('Uzbekistán',  'UZB', 'https://flagcdn.com/uz.svg', 150,  150,  'muy_alto', 2.00, 1000000)
on conflict (codigo_pais) do nothing;

-- ============================================================
-- TABLA: league_assets (POR TENANT)
-- Estado del mercado de cada equipo dentro de un tenant
-- ============================================================
create table if not exists public.league_assets (
  id                    uuid primary key default uuid_generate_v4(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  team_id               uuid not null references public.teams(id),
  precio_actual         numeric(10,2) not null,
  precio_apertura_dia   numeric(10,2),
  acciones_disponibles  integer not null,
  acciones_en_circulacion integer default 0,
  mercado_pausado       boolean default false,
  pausa_hasta           timestamptz,
  ultimo_update         timestamptz default now(),
  unique (tenant_id, team_id)
);

-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text,
  avatar_url      text,
  onboarding_completo boolean default false,
  fecha_creacion  timestamptz default now()
);

-- ============================================================
-- TABLA: portfolios (POR TENANT Y USUARIO)
-- El "Mi Equipo de Inversión" de cada usuario en un tenant
-- ============================================================
create table if not exists public.portfolios (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  saldo_coins     numeric(12,2) not null default 10000,
  perfil_riesgo   text not null default 'moderado' check (perfil_riesgo in ('conservador', 'moderado', 'arriesgado')),
  coins_iniciales numeric(12,2) default 10000,
  ultimo_acceso   timestamptz default now(),
  fecha_creacion  timestamptz default now(),
  unique (user_id, tenant_id)
);

-- ============================================================
-- TABLA: holdings (POR TENANT)
-- Partes de equipo que tiene cada usuario
-- ============================================================
create table if not exists public.holdings (
  id                    uuid primary key default uuid_generate_v4(),
  portfolio_id          uuid not null references public.portfolios(id) on delete cascade,
  tenant_id             uuid not null references public.tenants(id),
  team_id               uuid not null references public.teams(id),
  acciones              integer not null default 0,
  precio_promedio_compra numeric(10,2) not null,
  unique (portfolio_id, team_id)
);

-- ============================================================
-- TABLA: trades
-- Registro de todas las operaciones de compra y venta
-- ============================================================
create table if not exists public.trades (
  id              uuid primary key default uuid_generate_v4(),
  portfolio_id    uuid not null references public.portfolios(id),
  tenant_id       uuid not null references public.tenants(id),
  team_id         uuid not null references public.teams(id),
  tipo            text not null check (tipo in ('compra', 'venta_mercado', 'venta_limite', 'liquidacion', 'dividendo')),
  acciones        integer not null,
  precio_operacion numeric(10,2) not null,
  precio_limite   numeric(10,2),
  comision        numeric(10,2) default 0,
  estado          text default 'ejecutado' check (estado in ('ejecutado', 'pendiente', 'cancelado')),
  motivo          text,
  timestamp       timestamptz default now()
);

-- Índices para trades
create index if not exists idx_trades_tenant on public.trades(tenant_id);
create index if not exists idx_trades_portfolio on public.trades(portfolio_id);
create index if not exists idx_trades_team on public.trades(team_id);
create index if not exists idx_trades_estado on public.trades(estado);

-- ============================================================
-- TABLA: price_history
-- Historial de precios para velas japonesas
-- ============================================================
create table if not exists public.price_history (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id),
  team_id     uuid not null references public.teams(id),
  precio      numeric(10,2) not null,
  precio_open numeric(10,2),
  precio_high numeric(10,2),
  precio_low  numeric(10,2),
  precio_close numeric(10,2),
  volumen     integer default 0,
  timestamp   timestamptz default now(),
  motivo      text check (motivo in ('noticia', 'evento_vivo', 'demanda', 'liquidacion', 'dividendo', 'apertura'))
);

create index if not exists idx_price_history_tenant_team on public.price_history(tenant_id, team_id);
create index if not exists idx_price_history_timestamp on public.price_history(timestamp);

-- ============================================================
-- TABLA: market_events
-- Eventos en vivo que afectan precios (goles, tarjetas, etc)
-- ============================================================
create table if not exists public.market_events (
  id                  uuid primary key default uuid_generate_v4(),
  tenant_id           uuid not null references public.tenants(id),
  team_id             uuid not null references public.teams(id),
  tipo                text not null check (tipo in (
    'gol', 'doblete', 'hat_trick',
    'tarjeta_roja', 'tarjeta_roja_figura',
    'lesion_titular', 'atajada_penalti',
    'goleada', 'clasificacion', 'eliminacion'
  )),
  descripcion         text,
  jugador_nombre      text,
  puntaje_sentimiento numeric(4,3),
  impacto_precio      numeric(6,4),
  precio_antes        numeric(10,2),
  precio_despues      numeric(10,2),
  partido_id          text,
  timestamp           timestamptz default now()
);

create index if not exists idx_market_events_tenant on public.market_events(tenant_id);

-- ============================================================
-- TABLA: news_feed
-- Noticias procesadas por el NewsAnalyst (IA)
-- ============================================================
create table if not exists public.news_feed (
  id                  uuid primary key default uuid_generate_v4(),
  titular             text not null,
  fuente              text,
  url                 text,
  puntaje_sentimiento numeric(4,3),
  confianza           numeric(4,3),
  impacto_precio_pct  numeric(6,4),
  equipo_afectado     text,
  jugador_afectado    text,
  razonamiento        text,
  teams_afectados     uuid[],
  procesado           boolean default false,
  procesado_en        timestamptz,
  fecha_publicacion   timestamptz,
  fecha_creacion      timestamptz default now()
);

-- ============================================================
-- TABLA: checkpoints (Días de Cobro)
-- ============================================================
create table if not exists public.checkpoints (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references public.tenants(id),
  numero          integer not null check (numero in (1, 2, 3)),
  nombre          text not null,
  fecha           timestamptz,
  ejecutado       boolean default false,
  ranking_snapshot jsonb,
  fecha_ejecucion  timestamptz,
  unique (tenant_id, numero)
);

-- ============================================================
-- TABLA: alerts_log
-- Alertas del Broker Personal
-- ============================================================
create table if not exists public.alerts_log (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id),
  tenant_id   uuid not null references public.tenants(id),
  tipo        text not null check (tipo in (
    'partido_perdiendo', 'tarjeta_roja_figura',
    'noticia_negativa', 'coins_inactivos',
    'equipo_ganando', 'eliminacion', 'dividendo'
  )),
  mensaje     text not null,
  opciones    jsonb,
  team_id     uuid references public.teams(id),
  leida       boolean default false,
  accion_tomada text,
  timestamp   timestamptz default now()
);

create index if not exists idx_alerts_user on public.alerts_log(user_id);
create index if not exists idx_alerts_tenant on public.alerts_log(tenant_id);

-- ============================================================
-- TABLA: limit_orders (Órdenes de Venta con Precio Mínimo)
-- ============================================================
create table if not exists public.limit_orders (
  id              uuid primary key default uuid_generate_v4(),
  portfolio_id    uuid not null references public.portfolios(id),
  tenant_id       uuid not null references public.tenants(id),
  team_id         uuid not null references public.teams(id),
  acciones        integer not null,
  precio_minimo   numeric(10,2) not null,
  estado          text default 'activa' check (estado in ('activa', 'ejecutada', 'cancelada')),
  trade_id        uuid references public.trades(id),
  fecha_creacion  timestamptz default now(),
  fecha_expiracion timestamptz
);

-- ============================================================
-- TABLA: tenant_members
-- Vincula usuarios a tenants con su rol
-- ============================================================
create table if not exists public.tenant_members (
  id          uuid primary key default uuid_generate_v4(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  rol         text not null default 'jugador' check (rol in ('admin', 'jugador')),
  activo      boolean default true,
  fecha_union timestamptz default now(),
  unique (tenant_id, user_id)
);

-- ============================================================
-- FUNCIÓN: trigger para crear profile automáticamente
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre_completo, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- FUNCIÓN: deprecación diaria de coins inactivos (1% por día)
-- ============================================================
create or replace function public.aplicar_depreciacion_coins()
returns void
language plpgsql security definer
as $$
declare
  v_portfolio record;
  v_dias_inactivo integer;
  v_depreciacion numeric;
begin
  for v_portfolio in
    select p.id, p.saldo_coins, p.ultimo_acceso, p.tenant_id
    from public.portfolios p
    join public.tenants t on t.id = p.tenant_id
    where t.mercado_activo = true
  loop
    v_dias_inactivo := extract(day from (now() - v_portfolio.ultimo_acceso))::integer;

    if v_dias_inactivo >= 1 and v_portfolio.saldo_coins > 0 then
      -- Depreciar 1% por día de inactividad
      v_depreciacion := v_portfolio.saldo_coins * (0.01 * v_dias_inactivo);
      v_depreciacion := least(v_depreciacion, v_portfolio.saldo_coins * 0.01);

      update public.portfolios
      set saldo_coins = greatest(0, saldo_coins - v_depreciacion)
      where id = v_portfolio.id;
    end if;
  end loop;
end;
$$;

-- ============================================================
-- FUNCIÓN: calcular valor total del portafolio
-- ============================================================
create or replace function public.calcular_valor_portafolio(p_portfolio_id uuid, p_tenant_id uuid)
returns numeric
language plpgsql stable security definer
as $$
declare
  v_saldo_coins numeric;
  v_valor_holdings numeric;
begin
  select saldo_coins into v_saldo_coins
  from public.portfolios
  where id = p_portfolio_id;

  select coalesce(sum(h.acciones * la.precio_actual), 0) into v_valor_holdings
  from public.holdings h
  join public.league_assets la on la.team_id = h.team_id and la.tenant_id = p_tenant_id
  where h.portfolio_id = p_portfolio_id;

  return coalesce(v_saldo_coins, 0) + coalesce(v_valor_holdings, 0);
end;
$$;

-- ============================================================
-- FUNCIÓN: obtener leaderboard de un tenant
-- ============================================================
create or replace function public.get_leaderboard(p_tenant_id uuid, p_limit integer default 10)
returns table (
  posicion    bigint,
  user_id     uuid,
  nombre      text,
  valor_total numeric,
  ganancia_pct numeric
)
language plpgsql stable security definer
as $$
begin
  return query
  select
    row_number() over (order by calcular_valor_portafolio(p.id, p.tenant_id) desc) as posicion,
    p.user_id,
    pr.nombre_completo as nombre,
    calcular_valor_portafolio(p.id, p.tenant_id) as valor_total,
    round(
      ((calcular_valor_portafolio(p.id, p.tenant_id) - p.coins_iniciales) / p.coins_iniciales * 100)::numeric,
      2
    ) as ganancia_pct
  from public.portfolios p
  join public.profiles pr on pr.id = p.user_id
  where p.tenant_id = p_tenant_id
  order by valor_total desc
  limit p_limit;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.tenants enable row level security;
alter table public.teams enable row level security;
alter table public.league_assets enable row level security;
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.holdings enable row level security;
alter table public.trades enable row level security;
alter table public.price_history enable row level security;
alter table public.market_events enable row level security;
alter table public.news_feed enable row level security;
alter table public.checkpoints enable row level security;
alter table public.alerts_log enable row level security;
alter table public.limit_orders enable row level security;
alter table public.tenant_members enable row level security;

-- HELPER: verifica si el usuario actual es miembro del tenant
create or replace function public.es_miembro_tenant(p_tenant_id uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = p_tenant_id
    and user_id = auth.uid()
    and activo = true
  );
$$;

-- HELPER: verifica si el usuario actual es admin del tenant
create or replace function public.es_admin_tenant(p_tenant_id uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.tenant_members
    where tenant_id = p_tenant_id
    and user_id = auth.uid()
    and rol = 'admin'
    and activo = true
  );
$$;

-- Políticas: teams (lectura global para todos los autenticados)
create policy "Equipos visibles para todos" on public.teams
  for select using (true);

-- Políticas: tenants
create policy "Tenants visibles para sus miembros" on public.tenants
  for select using (es_miembro_tenant(id));

create policy "Admins pueden modificar su tenant" on public.tenants
  for update using (es_admin_tenant(id));

-- Políticas: league_assets
create policy "Assets visibles para miembros del tenant" on public.league_assets
  for select using (es_miembro_tenant(tenant_id));

-- Políticas: profiles
create policy "Perfil propio visible" on public.profiles
  for select using (id = auth.uid());

create policy "Perfil propio actualizable" on public.profiles
  for update using (id = auth.uid());

-- Políticas: portfolios
create policy "Portfolio propio visible" on public.portfolios
  for select using (user_id = auth.uid());

create policy "Portfolio propio actualizable" on public.portfolios
  for update using (user_id = auth.uid());

create policy "Portfolio insertable propio" on public.portfolios
  for insert with check (user_id = auth.uid());

-- Políticas: holdings
create policy "Holdings propios visibles" on public.holdings
  for select using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

create policy "Holdings propios modificables" on public.holdings
  for all using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

-- Políticas: trades
create policy "Trades propios visibles" on public.trades
  for select using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

create policy "Trades propios insertables" on public.trades
  for insert with check (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

-- Políticas: price_history (lectura para miembros del tenant)
create policy "Historial de precios visible para miembros" on public.price_history
  for select using (es_miembro_tenant(tenant_id));

-- Políticas: market_events
create policy "Eventos visibles para miembros" on public.market_events
  for select using (es_miembro_tenant(tenant_id));

-- Políticas: alerts_log
create policy "Alertas propias visibles" on public.alerts_log
  for select using (user_id = auth.uid());

create policy "Alertas propias actualizables" on public.alerts_log
  for update using (user_id = auth.uid());

-- Políticas: limit_orders
create policy "Órdenes propias visibles" on public.limit_orders
  for select using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

create policy "Órdenes propias modificables" on public.limit_orders
  for all using (
    portfolio_id in (select id from public.portfolios where user_id = auth.uid())
  );

-- Políticas: checkpoints
create policy "Checkpoints visibles para miembros" on public.checkpoints
  for select using (es_miembro_tenant(tenant_id));

-- Políticas: tenant_members
create policy "Miembros visibles dentro del tenant" on public.tenant_members
  for select using (es_miembro_tenant(tenant_id));

-- Políticas para news_feed (solo lectura, procesada por el servidor)
create policy "Noticias visibles para autenticados" on public.news_feed
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- REALTIME: habilitar publicaciones en tiempo real
-- ============================================================
alter publication supabase_realtime add table public.league_assets;
alter publication supabase_realtime add table public.market_events;
alter publication supabase_realtime add table public.price_history;
alter publication supabase_realtime add table public.alerts_log;
alter publication supabase_realtime add table public.trades;
alter publication supabase_realtime add table public.news_feed;
