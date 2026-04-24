import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NavegacionPrincipal } from '@/components/layout/navegacion-principal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PaginaLiga() {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: miembro } = await supabase
    .from('tenant_members')
    .select('tenant_id, tenants(*)')
    .eq('user_id', user.id)
    .eq('activo', true)
    .limit(1)
    .single()

  if (!miembro) redirect('/onboarding')

  const tenantId = miembro.tenant_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenant = (miembro.tenants as any) as Record<string, unknown>

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('saldo_coins')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  const { data: leaderboard } = await supabase.rpc('get_leaderboard', {
    p_tenant_id: tenantId,
    p_limit: 50,
  })

  const { data: checkpoints } = await supabase
    .from('checkpoints')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('numero')

  // Posición del usuario actual
  const miPosicion = leaderboard?.findIndex((e: { user_id: string }) => e.user_id === user.id) ?? -1

  const CHECKPOINTS_INFO = [
    { numero: 1, nombre: 'Día de Cobro 1', descripcion: 'Cierre de Fase de Grupos' },
    { numero: 2, nombre: 'Día de Cobro 2', descripcion: 'Cierre de Cuartos de Final' },
    { numero: 3, nombre: 'Día de Cobro Final', descripcion: 'Campeón definido — ranking de premios' },
  ]

  const pozoMonto = (tenant as { pozo_monto?: number })?.pozo_monto ?? 0
  const distribucion = ((tenant as { pozo_distribucion?: Array<{ posicion?: number; porcentaje: number; fondo_liga?: boolean }> })?.pozo_distribucion ?? [])

  return (
    <div className="min-h-screen bg-zinc-950">
      <NavegacionPrincipal tenantId={tenantId} saldoCoins={portfolio?.saldo_coins ?? 0} />

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">{(tenant as { nombre?: string })?.nombre ?? 'Mi Liga'}</h1>
            <p className="text-sm text-zinc-500">Clasificación y premios del torneo</p>
          </div>
          {pozoMonto > 0 && (
            <div className="text-right">
              <p className="text-xs text-zinc-500">Pozo de premios</p>
              <p className="text-2xl font-mono font-bold text-yellow-400">
                ${pozoMonto.toLocaleString('es-CO')}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-zinc-300 mb-3">Clasificación</h2>
            <div className="space-y-2">
              {(leaderboard ?? []).map((entry: {
                posicion: number
                user_id: string
                nombre: string
                valor_total: number
                ganancia_pct: number
              }, index: number) => {
                const esMiPosicion = entry.user_id === user.id
                const premioEstimado = pozoMonto > 0
                  ? (() => {
                      const dist = distribucion.find(d => d.posicion === entry.posicion)
                      return dist ? (pozoMonto * dist.porcentaje) / 100 : 0
                    })()
                  : 0

                return (
                  <Card
                    key={entry.user_id}
                    className={`border transition-colors ${
                      esMiPosicion
                        ? 'bg-emerald-900/20 border-emerald-700/50'
                        : entry.posicion <= 3
                        ? 'bg-zinc-900 border-yellow-800/30'
                        : 'bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <span className={`text-xl font-black w-10 text-center ${
                          entry.posicion === 1 ? 'text-yellow-400' :
                          entry.posicion === 2 ? 'text-zinc-300' :
                          entry.posicion === 3 ? 'text-orange-400' :
                          'text-zinc-600'
                        }`}>
                          {entry.posicion <= 3
                            ? ['🥇', '🥈', '🥉'][entry.posicion - 1]
                            : `#${entry.posicion}`}
                        </span>

                        <div className="flex-1">
                          <p className={`font-semibold ${esMiPosicion ? 'text-emerald-300' : 'text-zinc-200'}`}>
                            {entry.nombre ?? 'Jugador'}
                            {esMiPosicion && ' (tú)'}
                          </p>
                          {premioEstimado > 0 && (
                            <p className="text-xs text-yellow-500">
                              Premio estimado: ${premioEstimado.toLocaleString('es-CO')}
                            </p>
                          )}
                        </div>

                        <div className="text-right font-mono">
                          <p className="font-bold text-zinc-100">
                            ${entry.valor_total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                          </p>
                          <p className={`text-sm ${entry.ganancia_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {entry.ganancia_pct >= 0 ? '+' : ''}{entry.ganancia_pct.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Días de Cobro + distribución del pozo */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-300 mb-3">Días de Cobro</h2>
              <div className="space-y-3">
                {CHECKPOINTS_INFO.map((info) => {
                  const checkpoint = checkpoints?.find(c => c.numero === info.numero)
                  return (
                    <Card
                      key={info.numero}
                      className={`border ${checkpoint?.ejecutado ? 'bg-emerald-900/10 border-emerald-800/50' : 'bg-zinc-900 border-zinc-800'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-semibold text-sm ${checkpoint?.ejecutado ? 'text-emerald-400' : 'text-zinc-300'}`}>
                            {info.nombre}
                          </p>
                          {checkpoint?.ejecutado && <span className="text-emerald-400 text-xs">✓ Ejecutado</span>}
                        </div>
                        <p className="text-xs text-zinc-500">{info.descripcion}</p>
                        {checkpoint?.fecha_ejecucion && (
                          <p className="text-xs text-zinc-600 mt-1">
                            {new Date(checkpoint.fecha_ejecucion).toLocaleDateString('es-CO')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {pozoMonto > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-zinc-300 mb-3">Distribución de premios</h2>
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 space-y-2">
                    {distribucion.map((dist, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-zinc-400">
                          {dist.fondo_liga ? 'Fondo de liga' : `${dist.posicion}° lugar`}
                        </span>
                        <div className="text-right">
                          <span className="font-mono font-semibold text-zinc-200">
                            ${((pozoMonto * dist.porcentaje) / 100).toLocaleString('es-CO')}
                          </span>
                          <span className="text-zinc-600 text-xs ml-2">({dist.porcentaje}%)</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Link a pantalla pública */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-zinc-400 mb-2">Pantalla para televisor</p>
                <a
                  href={`/live/${(tenant as { slug?: string })?.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 text-sm underline"
                >
                  Ver pantalla pública →
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
