import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { NavegacionPrincipal } from '@/components/layout/navegacion-principal'
import { GraficaVelas } from '@/components/graficas/grafica-velas'
import { PanelTrade } from '@/components/mercado/panel-trade'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { CandleData, PriceHistory } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

const FASES_EQUIPOS: Record<string, string> = {
  grupos: 'Fase de Grupos',
  octavos: 'Octavos de Final',
  cuartos: 'Cuartos de Final',
  semis: 'Semifinales',
  final: 'Final',
  eliminado: 'Eliminado',
}

export default async function PaginaEquipo({ params }: Props) {
  const { id } = await params
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

  // Datos del equipo y su asset en el mercado
  const { data: asset } = await supabase
    .from('league_assets')
    .select('*, team:teams(*)')
    .eq('tenant_id', tenantId)
    .eq('team_id', id)
    .single()

  if (!asset) notFound()

  // Portfolio del usuario
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id, saldo_coins')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  // Holding del usuario para este equipo
  const { data: holding } = portfolio
    ? await supabase
        .from('holdings')
        .select('*')
        .eq('portfolio_id', portfolio.id)
        .eq('team_id', id)
        .single()
    : { data: null }

  // Historial de precios para velas
  const { data: historial } = await supabase
    .from('price_history')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('team_id', id)
    .order('timestamp', { ascending: true })
    .limit(200)

  const datosvelas: CandleData[] = (historial ?? []).map((h: PriceHistory) => ({
    timestamp: h.timestamp,
    open: h.precio_open ?? h.precio,
    high: h.precio_high ?? h.precio,
    low: h.precio_low ?? h.precio,
    close: h.precio_close ?? h.precio,
    volume: h.volumen ?? 0,
  }))

  // Noticias recientes relacionadas
  const { data: noticias } = await supabase
    .from('news_feed')
    .select('id, titular, fuente, puntaje_sentimiento, razonamiento, fecha_publicacion')
    .contains('teams_afectados', [id])
    .order('fecha_publicacion', { ascending: false })
    .limit(5)

  // Eventos recientes
  const { data: eventos } = await supabase
    .from('market_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('team_id', id)
    .order('timestamp', { ascending: false })
    .limit(10)

  const team = asset.team
  const cambio = ((asset.precio_actual - asset.precio_apertura_dia) / asset.precio_apertura_dia) * 100
  const colorCambio = cambio > 0 ? 'text-emerald-400' : cambio < 0 ? 'text-red-400' : 'text-zinc-400'
  const valorHolding = holding ? holding.acciones * asset.precio_actual : 0
  const gananciaHolding = holding
    ? valorHolding - holding.acciones * holding.precio_promedio_compra
    : 0

  return (
    <div className="min-h-screen bg-zinc-950">
      <NavegacionPrincipal tenantId={tenantId} saldoCoins={portfolio?.saldo_coins ?? 0} />

      <main className="container mx-auto px-4 py-6">
        {/* Encabezado del equipo */}
        <div className="flex items-center gap-4 mb-6">
          <img src={team.bandera_url} alt={team.nombre} className="w-16 h-11 object-cover rounded-md shadow-lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-zinc-100">{team.nombre}</h1>
              <Badge variant="outline" className="border-zinc-700 text-zinc-400">{team.codigo_pais}</Badge>
              {team.eliminado && (
                <Badge className="bg-red-900/30 text-red-400 border-red-800">Eliminado</Badge>
              )}
            </div>
            <p className="text-sm text-zinc-500">{FASES_EQUIPOS[team.fase_actual] ?? team.fase_actual}</p>
          </div>
        </div>

        {/* Precio y cambio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">Precio actual</p>
            <p className="text-2xl font-mono font-bold text-zinc-100">
              ${asset.precio_actual.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">Cambio hoy</p>
            <p className={`text-2xl font-mono font-bold ${colorCambio}`}>
              {cambio > 0 ? '+' : ''}{cambio.toFixed(2)}%
            </p>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">Precio IPO</p>
            <p className="text-2xl font-mono font-bold text-zinc-400">
              ${team.precio_ipo.toLocaleString('es-CO')}
            </p>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">Partes disponibles</p>
            <p className="text-2xl font-mono font-bold text-zinc-300">
              {asset.acciones_disponibles.toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfica de velas japonesas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
              <h2 className="text-sm font-semibold text-zinc-400 mb-4">Movimiento de precio</h2>
              <GraficaVelas datos={datosvelas} />
            </div>

            {/* Holding del usuario */}
            {holding && holding.acciones > 0 && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                <h2 className="text-sm font-semibold text-zinc-400 mb-3">Tus partes de este equipo</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-zinc-500">Partes</p>
                    <p className="text-xl font-mono font-bold text-zinc-100">{holding.acciones}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">Valor actual</p>
                    <p className="text-xl font-mono font-bold text-zinc-100">
                      ${valorHolding.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{gananciaHolding >= 0 ? 'Ganancia' : 'Pérdida'}</p>
                    <p className={`text-xl font-mono font-bold ${gananciaHolding >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {gananciaHolding >= 0 ? '+' : ''}${Math.abs(gananciaHolding).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Noticias de IA */}
            {noticias && noticias.length > 0 && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                <h2 className="text-sm font-semibold text-zinc-400 mb-3">Análisis de noticias</h2>
                <div className="space-y-3">
                  {noticias.map((noticia) => (
                    <div key={noticia.id} className="border-l-2 border-zinc-700 pl-3">
                      <p className="text-sm text-zinc-200">{noticia.titular}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-mono font-semibold ${
                          noticia.puntaje_sentimiento > 0 ? 'text-emerald-400' :
                          noticia.puntaje_sentimiento < 0 ? 'text-red-400' : 'text-zinc-400'
                        }`}>
                          {noticia.puntaje_sentimiento > 0 ? '▲' : noticia.puntaje_sentimiento < 0 ? '▼' : '▬'}
                          {' '}{noticia.puntaje_sentimiento > 0 ? 'Positivo' : noticia.puntaje_sentimiento < 0 ? 'Negativo' : 'Neutro'}
                        </span>
                        <span className="text-xs text-zinc-600">{noticia.fuente}</span>
                        <span className="text-xs text-zinc-600">
                          {noticia.fecha_publicacion
                            ? new Date(noticia.fecha_publicacion).toLocaleDateString('es-CO')
                            : ''}
                        </span>
                      </div>
                      {noticia.razonamiento && (
                        <p className="text-xs text-zinc-500 mt-0.5">{noticia.razonamiento}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Eventos recientes */}
            {eventos && eventos.length > 0 && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                <h2 className="text-sm font-semibold text-zinc-400 mb-3">Eventos en vivo</h2>
                <div className="space-y-2">
                  {eventos.map((evento) => (
                    <div key={evento.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{evento.tipo === 'gol' ? '⚽' : evento.tipo === 'tarjeta_roja' ? '🟥' : '📢'}</span>
                        <span className="text-zinc-300">{evento.descripcion ?? evento.tipo}</span>
                        {evento.jugador_nombre && (
                          <span className="text-zinc-500">— {evento.jugador_nombre}</span>
                        )}
                      </div>
                      <span className={`font-mono font-semibold ${
                        evento.impacto_precio > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {evento.impacto_precio > 0 ? '+' : ''}{(evento.impacto_precio * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel de compra/venta */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <PanelTrade
                asset={asset}
                tenantId={tenantId}
                saldoCoins={portfolio?.saldo_coins ?? 0}
                holding={holding ?? undefined}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
