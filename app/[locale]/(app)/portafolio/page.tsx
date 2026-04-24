import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NavegacionPrincipal } from '@/components/layout/navegacion-principal'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ShoppingBag } from 'lucide-react'

export default async function PaginaPortafolio() {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: miembro } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('activo', true)
    .limit(1)
    .single()

  if (!miembro) redirect('/onboarding')
  const tenantId = miembro.tenant_id

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!portfolio) redirect('/onboarding')

  const { data: holdings } = await supabase
    .from('holdings')
    .select('*, team:teams(*)')
    .eq('portfolio_id', portfolio.id)
    .eq('tenant_id', tenantId)
    .gt('acciones', 0)

  const teamIds = (holdings ?? []).map(h => h.team_id)
  const { data: preciosActuales } = teamIds.length > 0
    ? await supabase
        .from('league_assets')
        .select('team_id, precio_actual')
        .eq('tenant_id', tenantId)
        .in('team_id', teamIds)
    : { data: [] }

  const preciosPorEquipo: Record<string, number> = {}
  for (const p of preciosActuales ?? []) {
    preciosPorEquipo[p.team_id] = p.precio_actual
  }

  const { data: trades } = await supabase
    .from('trades')
    .select('*, team:teams(nombre, bandera_url, codigo_pais)')
    .eq('portfolio_id', portfolio.id)
    .order('timestamp', { ascending: false })
    .limit(20)

  const valorHoldings = (holdings ?? []).reduce((sum, h) => {
    const precioActual = preciosPorEquipo[h.team_id] ?? h.team.precio_ipo
    return sum + h.acciones * precioActual
  }, 0)

  const valorTotal    = (portfolio.saldo_coins ?? 0) + valorHoldings
  const gananciaTotal = valorTotal - portfolio.coins_iniciales
  const gananciaPct   = (gananciaTotal / portfolio.coins_iniciales) * 100
  const esGanancia    = gananciaTotal >= 0

  const PERFILES: Record<string, { etiqueta: string; color: string }> = {
    conservador: { etiqueta: 'Conservador', color: 'bg-blue-950 text-blue-300 border-blue-800' },
    moderado:    { etiqueta: 'Moderado',    color: 'bg-yellow-950 text-yellow-300 border-yellow-800' },
    arriesgado:  { etiqueta: 'Arriesgado',  color: 'bg-red-950 text-red-300 border-red-800' },
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <NavegacionPrincipal tenantId={tenantId} saldoCoins={portfolio.saldo_coins} />

      <main className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Hero: valor total */}
        <div className={`rounded-2xl border p-6 mb-6 ${
          esGanancia
            ? 'bg-emerald-950/30 border-emerald-900/50'
            : 'bg-red-950/30 border-red-900/50'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-semibold text-zinc-300">Mi portafolio</h1>
                <Badge variant="outline" className={PERFILES[portfolio.perfil_riesgo]?.color}>
                  {PERFILES[portfolio.perfil_riesgo]?.etiqueta}
                </Badge>
              </div>
              <p className="text-5xl font-black font-mono text-zinc-100 tracking-tight">
                ${valorTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className={`flex items-center gap-2 text-2xl font-bold font-mono ${esGanancia ? 'text-emerald-400' : 'text-red-400'}`}>
              {esGanancia ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
              <span>
                {esGanancia ? '+' : ''}{gananciaPct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Distribución */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-zinc-400 mb-1">Disponible</p>
            <p className="text-2xl font-mono font-bold text-emerald-400">
              ${portfolio.saldo_coins.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </p>
            <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min((portfolio.saldo_coins / valorTotal) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">
              {((portfolio.saldo_coins / valorTotal) * 100).toFixed(1)}% en efectivo
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-zinc-400 mb-1">En equipos</p>
            <p className="text-2xl font-mono font-bold text-zinc-100">
              ${valorHoldings.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </p>
            <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min((valorHoldings / valorTotal) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1.5">
              {((valorHoldings / valorTotal) * 100).toFixed(1)}% invertido
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-sm text-zinc-400 mb-1">Capital inicial</p>
            <p className="text-2xl font-mono font-bold text-zinc-400">
              ${portfolio.coins_iniciales.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </p>
            <p className={`text-sm font-mono font-semibold mt-3 ${esGanancia ? 'text-emerald-400' : 'text-red-400'}`}>
              {esGanancia ? '+' : ''}{gananciaTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })} coins
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              desde {new Date(portfolio.fecha_creacion).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>

        {/* Holdings */}
        <h2 className="text-xl font-bold text-zinc-100 mb-4">Mis selecciones</h2>
        {holdings && holdings.length > 0 ? (
          <div className="space-y-3 mb-10">
            {holdings.map((holding) => {
              const precioActual  = preciosPorEquipo[holding.team_id] ?? holding.team.precio_ipo
              const valorActual   = holding.acciones * precioActual
              const ganancia      = valorActual - holding.acciones * holding.precio_promedio_compra
              const gananciaPctH  = (ganancia / (holding.acciones * holding.precio_promedio_compra)) * 100
              const esPos         = ganancia >= 0

              return (
                <Link key={holding.id} href={`/equipo/${holding.team_id}`}>
                  <div className="group flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 rounded-2xl px-5 py-4 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <img
                        src={holding.team.bandera_url}
                        alt={holding.team.nombre}
                        className="w-14 h-9 object-cover rounded-lg shadow"
                      />
                      <div>
                        <p className="font-bold text-zinc-100 text-base group-hover:text-white">
                          {holding.team.nombre}
                        </p>
                        <p className="text-sm text-zinc-400 mt-0.5">
                          {holding.acciones} partes · prom.{' '}
                          <span className="font-mono">${holding.precio_promedio_compra.toLocaleString('es-CO')}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-mono font-bold text-zinc-100">
                        ${valorActual.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </p>
                      <p className={`text-sm font-semibold font-mono mt-0.5 ${esPos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {esPos ? '+' : ''}${Math.abs(ganancia).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        {' '}
                        <span className="text-xs">({esPos ? '+' : ''}{gananciaPctH.toFixed(1)}%)</span>
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 rounded-2xl py-16 mb-10">
            <ShoppingBag size={40} className="text-zinc-600 mb-3" />
            <p className="text-zinc-300 font-semibold text-lg">Aún no tienes selecciones</p>
            <p className="text-zinc-500 text-sm mt-1">Compra partes de equipos en el mercado</p>
            <Link
              href="/mercado"
              className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Ir al mercado →
            </Link>
          </div>
        )}

        {/* Historial */}
        <h2 className="text-xl font-bold text-zinc-100 mb-4">Historial de operaciones</h2>
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-4 text-left">Equipo</th>
                  <th className="px-5 py-4 text-left">Tipo</th>
                  <th className="px-5 py-4 text-right">Partes</th>
                  <th className="px-5 py-4 text-right">Precio</th>
                  <th className="px-5 py-4 text-right">Total</th>
                  <th className="px-5 py-4 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {(trades ?? []).map((trade) => {
                  const esCompra      = trade.tipo === 'compra'
                  const esLiquidacion = trade.tipo === 'liquidacion'
                  const esDividendo   = trade.tipo === 'dividendo'

                  const etiquetasMap: Record<string, string> = {
                    compra:        'Compra',
                    venta_mercado: 'Venta',
                    venta_limite:  'Venta límite',
                    liquidacion:   'Liquidación',
                    dividendo:     'Premio',
                  }
                  const etiqueta = etiquetasMap[trade.tipo as string] ?? trade.tipo

                  return (
                    <tr key={trade.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {trade.team && (
                            <img src={trade.team.bandera_url} alt="" className="w-8 h-5 object-cover rounded" />
                          )}
                          <span className="text-zinc-200 font-medium text-sm">{trade.team?.nombre ?? '-'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${
                            esCompra      ? 'border-emerald-800 text-emerald-300 bg-emerald-950/50' :
                            esLiquidacion ? 'border-zinc-600 text-zinc-400' :
                            esDividendo   ? 'border-yellow-800 text-yellow-300 bg-yellow-950/50' :
                                            'border-red-800 text-red-300 bg-red-950/50'
                          }`}
                        >
                          {etiqueta}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-zinc-200 text-sm">{trade.acciones}</td>
                      <td className="px-5 py-4 text-right font-mono text-zinc-400 text-sm">
                        ${trade.precio_operacion.toLocaleString('es-CO')}
                      </td>
                      <td className={`px-5 py-4 text-right font-mono font-bold text-sm ${esCompra ? 'text-red-400' : 'text-emerald-400'}`}>
                        {esCompra ? '-' : '+'}${(trade.acciones * trade.precio_operacion).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-5 py-4 text-right text-zinc-500 text-sm">
                        {new Date(trade.timestamp).toLocaleDateString('es-CO')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {(!trades || trades.length === 0) && (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-base">Sin operaciones todavía</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
