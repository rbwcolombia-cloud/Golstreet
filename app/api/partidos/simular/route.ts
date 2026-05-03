// ============================================================
// GolStreet — Simulador de Fase de Grupos FIFA World Cup 2026
// Cron cada hora — simula los partidos que ya debieron jugarse
// Solo activo cuando tenant.modo_simulacion = true
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MarketEngine } from '@/lib/engine/market-engine'
import { BrokerAlertas } from '@/lib/engine/broker-alertas'
import type { TipoEvento } from '@/types'

// ── Tipos locales ────────────────────────────────────────────
interface EquipoFixture {
  id: string
  nombre: string
  codigo_pais: string
  precio_ipo: number
  factor_riesgo: string
}

interface Fixture {
  id: string
  grupo: string
  jornada: number
  fecha_hora: string
  ciudad: string | null
  local: EquipoFixture
  visitante: EquipoFixture
}

interface ResultadoSimulado {
  localGoles: number
  visitanteGoles: number
  eventos: Array<{ teamId: string; tipo: TipoEvento; jugador?: string; descripcion: string }>
}

// ── PRNG determinista por fixture (reproducible si se re-ejecuta) ──
function makePRNG(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s ^= s >>> 16
    return (s >>> 0) / 0x100000000
  }
}

// ── Distribución de goles basada en fuerza del equipo ────────
// Usa aproximación Poisson: -ln(U) / tasa ≈ tiempo entre eventos
// Devuelve goles (0-5)
function simularGoles(fuerza: number, rand: () => number): number {
  // fuerza: 0.08 (NZL) → 1.0 (ARG)
  // media esperada: 0.4 (underdog) → 2.0 (favorito)
  const media = 0.4 + fuerza * 1.6
  let goles = 0
  let acumulado = 0
  while (goles < 5) {
    // Tiempo hasta siguiente gol ~ Exponencial(media)
    const tiempoSiguiente = -Math.log(Math.max(rand(), 0.0001)) / (media / 90)
    acumulado += tiempoSiguiente
    if (acumulado > 90) break
    goles++
  }
  return goles
}

// ── Fuerza normalizada de un equipo ──────────────────────────
function fuerzaEquipo(team: EquipoFixture): number {
  const MAX_IPO = 1800 // ARG
  return Math.max(0.05, Math.min(1.0, team.precio_ipo / MAX_IPO))
}

// ── Simular resultado completo de un partido ─────────────────
function simularPartido(local: EquipoFixture, visitante: EquipoFixture, rand: () => number): ResultadoSimulado {
  const fuerzaLocal = fuerzaEquipo(local) * 1.10   // +10% ventaja local (simulada)
  const fuerzaVisitante = fuerzaEquipo(visitante)

  const localGoles = simularGoles(fuerzaLocal, rand)
  const visitanteGoles = simularGoles(fuerzaVisitante, rand)

  const eventos: ResultadoSimulado['eventos'] = []

  // ── Eventos del equipo local ─────────────────────────────
  if (localGoles >= 3) {
    eventos.push({
      teamId: local.id,
      tipo: 'hat_trick',
      jugador: nombreFicticio(rand),
      descripcion: `🎩 Hat-trick — Grupo ${local.codigo_pais}`,
    })
  } else if (localGoles === 2) {
    eventos.push({
      teamId: local.id,
      tipo: 'doblete',
      jugador: nombreFicticio(rand),
      descripcion: `⚡ Doblete — Grupo ${local.codigo_pais}`,
    })
  } else if (localGoles === 1) {
    eventos.push({
      teamId: local.id,
      tipo: 'gol',
      jugador: nombreFicticio(rand),
      descripcion: `⚽ Gol — Grupo ${local.codigo_pais}`,
    })
  }

  // ── Eventos del equipo visitante ─────────────────────────
  if (visitanteGoles >= 3) {
    eventos.push({
      teamId: visitante.id,
      tipo: 'hat_trick',
      jugador: nombreFicticio(rand),
      descripcion: `🎩 Hat-trick — Grupo ${visitante.codigo_pais}`,
    })
  } else if (visitanteGoles === 2) {
    eventos.push({
      teamId: visitante.id,
      tipo: 'doblete',
      jugador: nombreFicticio(rand),
      descripcion: `⚡ Doblete — Grupo ${visitante.codigo_pais}`,
    })
  } else if (visitanteGoles === 1) {
    eventos.push({
      teamId: visitante.id,
      tipo: 'gol',
      jugador: nombreFicticio(rand),
      descripcion: `⚽ Gol — Grupo ${visitante.codigo_pais}`,
    })
  }

  // ── Goleada al perdedor (diferencia ≥ 3) ─────────────────
  const diff = Math.abs(localGoles - visitanteGoles)
  if (diff >= 3) {
    const perdedor = localGoles < visitanteGoles ? local : visitante
    eventos.push({
      teamId: perdedor.id,
      tipo: 'goleada',
      descripcion: `📉 Goleada recibida (${Math.min(localGoles, visitanteGoles)}-${Math.max(localGoles, visitanteGoles)})`,
    })
  }

  // ── Tarjetas rojas (8% de probabilidad por equipo) ───────
  if (rand() < 0.08) {
    eventos.push({
      teamId: local.id,
      tipo: 'tarjeta_roja',
      jugador: nombreFicticio(rand),
      descripcion: `🟥 Expulsión — ${local.nombre}`,
    })
  }
  if (rand() < 0.08) {
    eventos.push({
      teamId: visitante.id,
      tipo: 'tarjeta_roja',
      jugador: nombreFicticio(rand),
      descripcion: `🟥 Expulsión — ${visitante.nombre}`,
    })
  }

  return { localGoles, visitanteGoles, eventos }
}

// ── Nombres ficticios para narrativa del broker ───────────────
const NOMBRES = [
  'García','Silva','Müller','Kane','Diallo','Park','Fernández','Mbeki',
  'Costa','Lewandowski','Al-Dosari','Osei','Vargas','Nakamura','Chirinos',
  'Boateng','Totti','Benzema','Salah','Mané','De Bruyne','Modric','Casemiro',
]
function nombreFicticio(rand: () => number): string {
  return NOMBRES[Math.floor(rand() * NOMBRES.length)]
}

// ── Handler principal ────────────────────────────────────────
async function handler(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Tenants con simulación activa ────────────────────────
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, nombre')
    .eq('modo_simulacion', true)
    .eq('mercado_activo', true)

  if (!tenants || tenants.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'Ningún tenant con modo_simulacion activo', simulados: 0 })
  }

  // ── Partidos pendientes (ya debieron jugarse) ────────────
  // Ventana: desde hace 25 horas (evita re-procesar, permite run tardío)
  const ahora = new Date()
  const ventanaDesde = new Date(ahora.getTime() - 25 * 60 * 60 * 1000)

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select(`
      id, grupo, jornada, fecha_hora, ciudad,
      local:teams!fixtures_local_id_fkey(id, nombre, codigo_pais, precio_ipo, factor_riesgo),
      visitante:teams!fixtures_visitante_id_fkey(id, nombre, codigo_pais, precio_ipo, factor_riesgo)
    `)
    .lte('fecha_hora', ahora.toISOString())
    .gte('fecha_hora', ventanaDesde.toISOString())
    .eq('simulado', false)
    .order('fecha_hora', { ascending: true })
    .limit(8) as { data: Fixture[] | null }

  if (!fixtures || fixtures.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'Sin partidos pendientes de simular', simulados: 0 })
  }

  const resumen: string[] = []
  let totalEventosAplicados = 0

  for (const fixture of fixtures) {
    const { local, visitante } = fixture

    // Semilla determinista basada en el ID del fixture (reproducible)
    const seed = fixture.id.split('-').reduce((acc, part) => acc ^ parseInt(part, 16), 0)
    const rand = makePRNG(Math.abs(seed))

    const resultado = simularPartido(local, visitante, rand)
    const { localGoles, visitanteGoles, eventos } = resultado

    const etiqueta = `Grupo ${fixture.grupo} J${fixture.jornada}: ${local.codigo_pais} ${localGoles}-${visitanteGoles} ${visitante.codigo_pais} (${fixture.ciudad})`
    resumen.push(etiqueta)

    // ── Aplicar a todos los tenants activos ──────────────
    for (const tenant of tenants) {
      const engine = new MarketEngine(tenant.id)
      const broker = new BrokerAlertas(tenant.id)

      for (const evento of eventos) {
        const precioAntes = await obtenerPrecio(supabase, tenant.id, evento.teamId)

        const marketEvento = await engine.aplicarEventoEnVivo(
          evento.teamId,
          evento.tipo,
          `[${etiqueta}] ${evento.descripcion}`,
          evento.jugador,
        )

        if (marketEvento) {
          totalEventosAplicados++
          await broker.alertarPorEvento(
            evento.teamId,
            evento.tipo,
            evento.jugador,
            marketEvento.impacto_precio,
            precioAntes,
            marketEvento.precio_despues,
          )
        }
      }

      // ── Notificar a usuarios con holdings en estos equipos ──
      const equiposAfectados = [local.id, visitante.id]
      const { data: holdings } = await supabase
        .from('holdings')
        .select('portfolio_id, team_id, acciones, portfolios(user_id)')
        .eq('tenant_id', tenant.id)
        .in('team_id', equiposAfectados)
        .gt('acciones', 0)

      if (holdings) {
        const notificados = new Set<string>()
        for (const h of holdings) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userId = (h.portfolios as any)?.user_id
          if (!userId || notificados.has(userId)) continue
          notificados.add(userId)

          const esLocal = h.team_id === local.id
          const miEquipo = esLocal ? local : visitante
          const gMios = esLocal ? localGoles : visitanteGoles
          const gRival = esLocal ? visitanteGoles : localGoles

          const icono = gMios > gRival ? '🟢' : gMios < gRival ? '🔴' : '🟡'
          await engine.crearAlerta(
            userId,
            'partido_simulado',
            `${icono} Grupo ${fixture.grupo} J${fixture.jornada} · ${miEquipo.nombre} ${gMios}-${gRival} · ${fixture.ciudad ?? ''}`,
            h.team_id,
          )
        }
      }
    }

    // ── Marcar fixture como simulado ──────────────────────
    await supabase
      .from('fixtures')
      .update({
        simulado: true,
        simulado_en: new Date().toISOString(),
        local_goles: localGoles,
        visitante_goles: visitanteGoles,
      })
      .eq('id', fixture.id)
  }

  return NextResponse.json({
    ok: true,
    simulados: fixtures.length,
    eventos_aplicados: totalEventosAplicados,
    resumen,
  })
}

// ── Helpers ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function obtenerPrecio(supabase: any, tenantId: string, teamId: string): Promise<number> {
  const { data } = await supabase
    .from('league_assets')
    .select('precio_actual')
    .eq('tenant_id', tenantId)
    .eq('team_id', teamId)
    .single()
  return data?.precio_actual ?? 0
}

export { handler as GET, handler as POST }
