// ============================================================
// GolStreet — Simulador de Fase de Grupos FIFA World Cup 2026
// Cron cada hora — soporta dos modos:
//
//   MODO REAL (modo_simulacion=true, modo_acelerado=false)
//   → Simula partidos cuando llega su fecha/hora real (jun 11 – jul 3)
//
//   MODO BETA (modo_simulacion=true, modo_acelerado=true)
//   → Comprime los 72 partidos en beta_duracion_dias días
//   → Los resultados se guardan en fixtures_simuladas (por tenant)
//     para no interferir con el calendario real del Mundial
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MarketEngine } from '@/lib/engine/market-engine'
import { BrokerAlertas } from '@/lib/engine/broker-alertas'
import type { TipoEvento } from '@/types'

// ── Constantes del calendario real del Mundial ───────────────
const WC_INICIO   = new Date('2026-06-11T21:00:00Z') // Partido inaugural
const WC_FIN_FASE = new Date('2026-07-03T21:00:00Z') // Último partido grupo L
const WC_DURACION_MS = WC_FIN_FASE.getTime() - WC_INICIO.getTime()

// ── Tipos ────────────────────────────────────────────────────
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
  local:     EquipoFixture
  visitante: EquipoFixture
}

interface TenantConfig {
  id: string
  nombre: string
  modo_acelerado: boolean
  beta_inicio: string | null
  beta_duracion_dias: number
}

interface ResultadoSimulado {
  localGoles: number
  visitanteGoles: number
  eventos: Array<{
    teamId:      string
    tipo:        TipoEvento
    jugador?:    string
    descripcion: string
  }>
}

// ── PRNG determinista por fixture ────────────────────────────
function makePRNG(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
    s ^= s >>> 16
    return (s >>> 0) / 0x100000000
  }
}

// ── Distribución de goles basada en fuerza (Poisson aprox.) ──
function simularGoles(fuerza: number, ventajaLocal: boolean, rand: () => number): number {
  const base  = 0.4 + fuerza * 1.6
  const media = ventajaLocal ? base * 1.1 : base
  let goles = 0, t = 0
  while (goles < 5) {
    t += -Math.log(Math.max(rand(), 0.0001)) / (media / 90)
    if (t > 90) break
    goles++
  }
  return goles
}

function fuerzaEquipo(team: EquipoFixture): number {
  return Math.max(0.05, Math.min(1.0, team.precio_ipo / 1800))
}

// ── Simular partido completo ──────────────────────────────────
function simularPartido(
  local: EquipoFixture,
  visitante: EquipoFixture,
  rand: () => number
): ResultadoSimulado {
  const localGoles     = simularGoles(fuerzaEquipo(local),     true,  rand)
  const visitanteGoles = simularGoles(fuerzaEquipo(visitante), false, rand)
  const eventos: ResultadoSimulado['eventos'] = []

  // Eventos ofensivos
  for (const [team, goles] of [[local, localGoles], [visitante, visitanteGoles]] as const) {
    if (goles === 0) continue
    const tipo: TipoEvento = goles >= 3 ? 'hat_trick' : goles === 2 ? 'doblete' : 'gol'
    eventos.push({
      teamId:      team.id,
      tipo,
      jugador:     nombreFicticio(rand),
      descripcion: tipo === 'hat_trick' ? `🎩 Hat-trick` : tipo === 'doblete' ? `⚡ Doblete` : `⚽ Gol`,
    })
  }

  // Goleada al perdedor (diff ≥ 3)
  const diff = Math.abs(localGoles - visitanteGoles)
  if (diff >= 3) {
    const perdedor = localGoles < visitanteGoles ? local : visitante
    eventos.push({
      teamId:      perdedor.id,
      tipo:        'goleada',
      descripcion: `📉 Goleada (${Math.min(localGoles, visitanteGoles)}-${Math.max(localGoles, visitanteGoles)})`,
    })
  }

  // Tarjetas rojas (8% por equipo)
  for (const team of [local, visitante]) {
    if (rand() < 0.08) {
      eventos.push({
        teamId:      team.id,
        tipo:        'tarjeta_roja',
        jugador:     nombreFicticio(rand),
        descripcion: `🟥 Expulsión`,
      })
    }
  }

  return { localGoles, visitanteGoles, eventos }
}

const NOMBRES = [
  'García','Silva','Müller','Kane','Diallo','Park','Fernández',
  'Costa','Vargas','Nakamura','Boateng','De Bruyne','Modric','Salah',
  'Benzema','Mané','Al-Dosari','Osei','Chirinos','Lewandowski',
]
function nombreFicticio(r: () => number): string {
  return NOMBRES[Math.floor(r() * NOMBRES.length)]
}

// ── Calcular "fecha límite virtual" para el modo acelerado ────
// Mapea el tiempo transcurrido del beta al tiempo equivalente del Mundial
// Ej: beta_duracion=7d, 3.5 días de beta = mitad del Mundial ≈ ~11.5 días desde Jun 11
function fechaLimiteVirtual(tenant: TenantConfig): Date {
  if (!tenant.beta_inicio) return new Date(0)

  const betaInicioMs   = new Date(tenant.beta_inicio).getTime()
  const betaDuracionMs = tenant.beta_duracion_dias * 24 * 60 * 60 * 1000
  const transcurridoMs = Date.now() - betaInicioMs

  // Factor de escala: cuánto tiempo del Mundial equivale a 1ms de beta
  const factor = WC_DURACION_MS / betaDuracionMs

  // Tiempo "virtual" dentro del Mundial
  const wcTranscurridoMs = transcurridoMs * factor

  return new Date(WC_INICIO.getTime() + wcTranscurridoMs)
}

// ── Handler ──────────────────────────────────────────────────
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
    .select('id, nombre, modo_acelerado, beta_inicio, beta_duracion_dias')
    .eq('modo_simulacion', true)
    .eq('mercado_activo', true) as { data: TenantConfig[] | null }

  if (!tenants || tenants.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'Ningún tenant con modo_simulacion activo', simulados: 0 })
  }

  const logGlobal: string[] = []
  let totalEventosAplicados = 0
  let totalSimulados = 0

  for (const tenant of tenants) {
    // ── Determinar la ventana de tiempo ──────────────────
    let fechaLimite: Date
    let ventanaDesdeMs: number

    if (tenant.modo_acelerado && tenant.beta_inicio) {
      // Beta: usar tiempo virtual mapeado al calendario del Mundial
      fechaLimite     = fechaLimiteVirtual(tenant)
      ventanaDesdeMs  = 2 * 60 * 60 * 1000 // Ventana de 2h virtuales hacia atrás
      // (la ventana real es irrelevante aquí, el check por fixtures_simuladas evita repetición)
    } else {
      // Modo real: fixtures cuya hora ya pasó (ventana 25h para runs tardíos)
      fechaLimite    = new Date()
      ventanaDesdeMs = 25 * 60 * 60 * 1000
    }

    const ventanaDesde = new Date(
      tenant.modo_acelerado && tenant.beta_inicio
        ? WC_INICIO.getTime()                    // Beta: desde el inicio del WC virtual
        : fechaLimite.getTime() - ventanaDesdeMs  // Real: últimas 25h
    )

    // ── Fixtures candidatos ───────────────────────────────
    const { data: fixtures } = await supabase
      .from('fixtures')
      .select(`
        id, grupo, jornada, fecha_hora, ciudad,
        local:teams!fixtures_local_id_fkey(id, nombre, codigo_pais, precio_ipo, factor_riesgo),
        visitante:teams!fixtures_visitante_id_fkey(id, nombre, codigo_pais, precio_ipo, factor_riesgo)
      `)
      .lte('fecha_hora', fechaLimite.toISOString())
      .gte('fecha_hora', ventanaDesde.toISOString())
      .order('fecha_hora', { ascending: true })
      .limit(12) as { data: Fixture[] | null }

    if (!fixtures || fixtures.length === 0) continue

    // ── Excluir los ya simulados para ESTE tenant ─────────
    const { data: yaSimuladas } = await supabase
      .from('fixtures_simuladas')
      .select('fixture_id')
      .eq('tenant_id', tenant.id)
      .in('fixture_id', fixtures.map(f => f.id))

    const idsYaSimulados = new Set((yaSimuladas ?? []).map((r: { fixture_id: string }) => r.fixture_id))
    const pendientes = fixtures.filter(f => !idsYaSimulados.has(f.id))

    if (pendientes.length === 0) continue

    const engine = new MarketEngine(tenant.id)
    const broker  = new BrokerAlertas(tenant.id)

    for (const fixture of pendientes) {
      const { local, visitante } = fixture

      // PRNG determinista (misma semilla = mismo resultado si se re-ejecuta)
      const seed = fixture.id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)
      const rand = makePRNG(Math.abs(seed))

      const { localGoles, visitanteGoles, eventos } = simularPartido(local, visitante, rand)

      const jornada = tenant.modo_acelerado
        ? `Beta J${fixture.jornada} Grupo ${fixture.grupo}`
        : `J${fixture.jornada} Grupo ${fixture.grupo}`
      const etiqueta = `${jornada}: ${local.codigo_pais} ${localGoles}–${visitanteGoles} ${visitante.codigo_pais}`
      logGlobal.push(etiqueta)

      // Aplicar eventos al MarketEngine
      for (const ev of eventos) {
        const precioAntes = await getPrecio(supabase, tenant.id, ev.teamId)
        const me = await engine.aplicarEventoEnVivo(
          ev.teamId, ev.tipo,
          `[${etiqueta}] ${ev.descripcion}`,
          ev.jugador,
        )
        if (me) {
          totalEventosAplicados++
          await broker.alertarPorEvento(ev.teamId, ev.tipo, ev.jugador, me.impacto_precio, precioAntes, me.precio_despues)
        }
      }

      // Notificar a usuarios con holdings en estos equipos
      const { data: holdings } = await supabase
        .from('holdings')
        .select('portfolio_id, team_id, acciones, portfolios(user_id)')
        .eq('tenant_id', tenant.id)
        .in('team_id', [local.id, visitante.id])
        .gt('acciones', 0)

      if (holdings) {
        const vistos = new Set<string>()
        for (const h of holdings) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const uid = (h.portfolios as any)?.user_id
          if (!uid || vistos.has(uid)) continue
          vistos.add(uid)

          const esMiEquipo = (id: string) => h.team_id === id
          const miEquipo   = esMiEquipo(local.id) ? local : visitante
          const gMios      = esMiEquipo(local.id) ? localGoles : visitanteGoles
          const gRival     = esMiEquipo(local.id) ? visitanteGoles : localGoles
          const icono      = gMios > gRival ? '🟢' : gMios < gRival ? '🔴' : '🟡'

          await engine.crearAlerta(uid, 'partido_simulado',
            `${icono} ${etiqueta} · ${miEquipo.nombre} ${gMios}–${gRival}`,
            h.team_id)
        }
      }

      // Guardar resultado por tenant (NO toca fixtures.simulado)
      await supabase.from('fixtures_simuladas').upsert({
        tenant_id:       tenant.id,
        fixture_id:      fixture.id,
        local_goles:     localGoles,
        visitante_goles: visitanteGoles,
        simulado_en:     new Date().toISOString(),
      }, { onConflict: 'tenant_id,fixture_id' })

      totalSimulados++
    }
  }

  return NextResponse.json({
    ok: true,
    simulados: totalSimulados,
    eventos_aplicados: totalEventosAplicados,
    log: logGlobal,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPrecio(supabase: any, tenantId: string, teamId: string): Promise<number> {
  const { data } = await supabase
    .from('league_assets')
    .select('precio_actual')
    .eq('tenant_id', tenantId)
    .eq('team_id', teamId)
    .single()
  return data?.precio_actual ?? 0
}

export { handler as GET, handler as POST }
