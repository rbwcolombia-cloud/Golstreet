import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TickerScroll } from '@/components/mercado/ticker-scroll'
import { TarjetaEquipo } from '@/components/mercado/tarjeta-equipo'
import { NavegacionPrincipal } from '@/components/layout/navegacion-principal'
import type { LeagueAsset, Team, TickerItem } from '@/types'

export default async function PaginaMercado() {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: miembro } = await supabase
    .from('tenant_members')
    .select('tenant_id, tenants(id, nombre, mercado_activo)')
    .eq('user_id', user.id)
    .eq('activo', true)
    .order('fecha_union', { ascending: false })
    .limit(1)
    .single()

  if (!miembro) redirect('/onboarding')

  const tenantId = miembro.tenant_id

  const { data: assets } = await supabase
    .from('league_assets')
    .select('*, team:teams(*)')
    .eq('tenant_id', tenantId)
    .order('precio_actual', { ascending: false })

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('saldo_coins')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  const tickerItems: TickerItem[] = (assets ?? []).map((a: LeagueAsset & { team: Team }) => ({
    codigo_pais: a.team.codigo_pais,
    nombre: a.team.nombre,
    precio_actual: a.precio_actual,
    cambio_pct: ((a.precio_actual - a.precio_apertura_dia) / a.precio_apertura_dia) * 100,
    bandera_url: a.team.bandera_url,
  }))

  const totalEquipos = (assets ?? []).length
  const enAlza = (assets ?? []).filter((a: LeagueAsset) => a.precio_actual > a.precio_apertura_dia).length
  const enBaja = (assets ?? []).filter((a: LeagueAsset) => a.precio_actual < a.precio_apertura_dia).length

  return (
    <div className="min-h-screen bg-zinc-950">
      <NavegacionPrincipal tenantId={tenantId} saldoCoins={portfolio?.saldo_coins ?? 0} />
      <TickerScroll tenantId={tenantId} inicial={tickerItems} />

      <main className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-zinc-100 tracking-tight">Mercado</h1>
            <p className="text-base text-zinc-400 mt-1">
              Compra y vende partes de selecciones en tiempo real
            </p>
          </div>

          {/* Stats rápidas */}
          {totalEquipos > 0 && (
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-center">
                <p className="text-xs text-zinc-500 mb-0.5">Equipos</p>
                <p className="text-lg font-bold text-zinc-100">{totalEquipos}</p>
              </div>
              <div className="bg-emerald-950/50 border border-emerald-900/50 rounded-xl px-4 py-2.5 text-center">
                <p className="text-xs text-emerald-500 mb-0.5">En alza</p>
                <p className="text-lg font-bold text-emerald-400">{enAlza}</p>
              </div>
              <div className="bg-red-950/50 border border-red-900/50 rounded-xl px-4 py-2.5 text-center">
                <p className="text-xs text-red-500 mb-0.5">En baja</p>
                <p className="text-lg font-bold text-red-400">{enBaja}</p>
              </div>
            </div>
          )}
        </div>

        {/* Grid de equipos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(assets ?? []).map((asset: LeagueAsset & { team: Team }) => (
            <TarjetaEquipo key={asset.id} asset={asset} />
          ))}
        </div>

        {(!assets || assets.length === 0) && (
          <div className="text-center py-24 border border-zinc-800 rounded-2xl bg-zinc-900/30">
            <p className="text-5xl mb-4">🏟️</p>
            <p className="text-zinc-300 text-xl font-semibold">El mercado aún no tiene equipos</p>
            <p className="text-zinc-500 text-base mt-2">El administrador debe inicializar el mercado desde el panel admin.</p>
          </div>
        )}
      </main>
    </div>
  )
}
