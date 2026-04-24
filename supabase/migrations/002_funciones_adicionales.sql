-- ============================================================
-- GolStreet — Funciones adicionales para el MarketEngine
-- ============================================================

-- Estadísticas de trades por equipo en un tenant (para el AMM)
create or replace function public.get_trade_stats_team(
  p_tenant_id uuid,
  p_team_id uuid
)
returns table (
  acciones_compradas bigint,
  acciones_vendidas  bigint
)
language plpgsql stable security definer
as $$
begin
  return query
  select
    coalesce(sum(case when tipo = 'compra' then acciones else 0 end), 0) as acciones_compradas,
    coalesce(sum(case when tipo in ('venta_mercado', 'venta_limite') then acciones else 0 end), 0) as acciones_vendidas
  from public.trades
  where tenant_id = p_tenant_id
    and team_id = p_team_id
    and estado = 'ejecutado';
end;
$$;

-- Función para obtener el precio actual de un equipo en un tenant
create or replace function public.get_precio_equipo(p_tenant_id uuid, p_team_id uuid)
returns numeric
language sql stable security definer
as $$
  select precio_actual from public.league_assets
  where tenant_id = p_tenant_id and team_id = p_team_id;
$$;

-- Vista: resumen del mercado por tenant (para la pantalla pública)
create or replace view public.vista_mercado_publico as
select
  la.tenant_id,
  la.team_id,
  la.precio_actual,
  la.precio_apertura_dia,
  la.acciones_disponibles,
  la.mercado_pausado,
  round(((la.precio_actual - la.precio_apertura_dia) / nullif(la.precio_apertura_dia, 0) * 100)::numeric, 2) as cambio_pct,
  t.nombre as team_nombre,
  t.codigo_pais,
  t.bandera_url,
  t.factor_riesgo,
  t.fase_actual,
  t.eliminado
from public.league_assets la
join public.teams t on t.id = la.team_id
order by la.precio_actual desc;

-- Política RLS para la vista pública (acceso sin autenticación)
-- La vista hereda las políticas de las tablas base

-- Índice para acelerar búsquedas de alertas no leídas
create index if not exists idx_alerts_user_no_leidas
  on public.alerts_log(user_id, tenant_id, leida)
  where leida = false;

-- Índice para acelerar limit orders activas
create index if not exists idx_limit_orders_activas
  on public.limit_orders(tenant_id, estado, team_id)
  where estado = 'activa';

-- Índice para historial de precio por tiempo
create index if not exists idx_price_history_team_tiempo
  on public.price_history(tenant_id, team_id, timestamp desc);
