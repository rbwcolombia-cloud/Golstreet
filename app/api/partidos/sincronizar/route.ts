// Cron: sincronizar eventos en vivo de API-Football cada 2 minutos
import { NextRequest, NextResponse } from 'next/server'
import { APIFootball } from '@/lib/api/api-football'
import { MarketEngine } from '@/lib/engine/market-engine'
import { BrokerAlertas } from '@/lib/engine/broker-alertas'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const apifootball = new APIFootball()
  const eventosPendientes = await apifootball.obtenerEventosPendientes()

  if (eventosPendientes.length === 0) {
    return NextResponse.json({ ok: true, eventos: 0 })
  }

  // Obtener todos los tenants activos
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('mercado_activo', true)

  if (!tenants) return NextResponse.json({ ok: true, eventos: 0 })

  // Obtener IDs de equipos por código de país
  const { data: teams } = await supabase
    .from('teams')
    .select('id, codigo_pais')

  const codigoAId: Record<string, string> = {}
  for (const t of teams ?? []) {
    codigoAId[t.codigo_pais] = t.id
  }

  let eventosAplicados = 0

  for (const tenant of tenants) {
    const engine = new MarketEngine(tenant.id)
    const broker = new BrokerAlertas(tenant.id)

    for (const evento of eventosPendientes) {
      const teamId = codigoAId[evento.codigoPais]
      if (!teamId) continue

      // Verificar que el mercado no esté pausado para este equipo
      const { data: asset } = await supabase
        .from('league_assets')
        .select('mercado_pausado, precio_actual')
        .eq('tenant_id', tenant.id)
        .eq('team_id', teamId)
        .single()

      if (asset?.mercado_pausado) continue

      const precioAntes = asset?.precio_actual ?? 0

      const eventoRegistrado = await engine.aplicarEventoEnVivo(
        teamId,
        evento.tipo,
        evento.descripcion,
        evento.jugador,
        evento.fixtureId,
      )

      if (eventoRegistrado) {
        eventosAplicados++

        // Disparar alertas del broker para este evento
        await broker.alertarPorEvento(
          teamId,
          evento.tipo,
          evento.jugador,
          eventoRegistrado.impacto_precio,
          precioAntes,
          eventoRegistrado.precio_despues,
        )
      }
    }
  }

  return NextResponse.json({ ok: true, eventos: eventosAplicados })
}
