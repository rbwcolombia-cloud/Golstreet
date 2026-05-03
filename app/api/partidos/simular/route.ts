// ============================================================
// GolStreet — Simulador de Partidos Amistosos
// Cron 2x semana (mar y sáb 20:00 COT) para beta pre-Mundial
// Activo cuando tenant.modo_simulacion = true
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MarketEngine } from '@/lib/engine/market-engine'
import { BrokerAlertas } from '@/lib/engine/broker-alertas'
import type { TipoEvento } from '@/types'

// ── Distribución de goles por equipo: [0,1,2,3] con pesos [30,40,20,10]
function generarGoles(rand: () => number): number {
  const r = rand() * 100
  if (r < 30) return 0
  if (r < 70) return 1
  if (r < 90) return 2
  return 3
}

// ── PRNG determinista basado en semilla (evita repetir el mismo partido)
function makePRNG(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return ((s >>> 0) / 0xffffffff)
  }
}

// ── Nombres de jugadores ficticios para narrativa
const NOMBRES_FICTICIOS = [
  'García', 'Silva', 'Müller', 'Kane', 'Diallo', 'Park',
  'Fernández', 'Mbeki', 'Costa', 'Lewandowski', 'Al-Dosari',
  'Osei', 'Vargas', 'Nakamura', 'Chirinos', 'Boateng',
]

function nombreAleatorio(rand: () => number): string {
  return NOMBRES_FICTICIOS[Math.floor(rand() * NOMBRES_FICTICIOS.length)]
}

// ── Barajar array (Fisher-Yates) usando nuestro PRNG
function barajar<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Calcular semilla única por semana (varía cada lunes)
function semanaActual(): number {
  const lunes = new Date()
  lunes.setHours(0, 0, 0, 0)
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))
  return Math.floor(lunes.getTime() / 1000)
}

async function handler(request: NextRequest): Promise<NextResponse> {
  // ── Auth cron
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── Tenants con simulación activa y mercado abierto
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, nombre')
    .eq('modo_simulacion', true)
    .eq('mercado_activo', true)

  if (!tenants || tenants.length === 0) {
    return NextResponse.json({ ok: true, mensaje: 'Ningún tenant con modo_simulacion activo', simulaciones: 0 })
  }

  // ── Equipos no eliminados disponibles para simular
  const { data: teams } = await supabase
    .from('teams')
    .select('id, nombre, codigo_pais, factor_riesgo')
    .eq('eliminado', false)

  if (!teams || teams.length < 4) {
    return NextResponse.json({ ok: true, mensaje: 'No hay suficientes equipos disponibles', simulaciones: 0 })
  }

  const rand = makePRNG(semanaActual() + Date.now() % 10000)
  const equiposBarajados = barajar(teams, rand)

  // ── 4 partidos por semana (8 equipos, ninguno repite)
  const NUM_PARTIDOS = Math.min(4, Math.floor(equiposBarajados.length / 2))
  const partidos: Array<{ local: typeof teams[0]; visitante: typeof teams[0] }> = []
  for (let i = 0; i < NUM_PARTIDOS; i++) {
    partidos.push({ local: equiposBarajados[i * 2], visitante: equiposBarajados[i * 2 + 1] })
  }

  let totalEventos = 0
  const resumen: string[] = []

  for (const tenant of tenants) {
    const engine = new MarketEngine(tenant.id)
    const broker = new BrokerAlertas(tenant.id)

    for (const partido of partidos) {
      const golesLocal = generarGoles(rand)
      const golesVisitante = generarGoles(rand)
      const tarjetaLocal = rand() < 0.12  // 12% de probabilidad
      const tarjetaVisitante = rand() < 0.12

      const diff = Math.abs(golesLocal - golesVisitante)
      const ganadorId = golesLocal > golesVisitante
        ? partido.local.id
        : golesLocal < golesVisitante
          ? partido.visitante.id
          : null

      const perdedorId = golesLocal < golesVisitante
        ? partido.local.id
        : golesLocal > golesVisitante
          ? partido.visitante.id
          : null

      const labelPartido = `Amistoso: ${partido.local.codigo_pais} ${golesLocal}-${golesVisitante} ${partido.visitante.codigo_pais}`
      resumen.push(labelPartido)

      // ── Verificar que ambos equipos existen en este tenant
      const { data: assetsDisponibles } = await supabase
        .from('league_assets')
        .select('team_id')
        .eq('tenant_id', tenant.id)
        .in('team_id', [partido.local.id, partido.visitante.id])
        .eq('mercado_pausado', false)

      const idsDisponibles = new Set((assetsDisponibles ?? []).map((a: { team_id: string }) => a.team_id))
      if (idsDisponibles.size < 2) continue

      // ── Aplicar eventos: goles del equipo local
      for (let g = 0; g < golesLocal; g++) {
        let tipo: TipoEvento = 'gol'
        if (golesLocal === 3 && g === 2) tipo = 'hat_trick'
        else if (golesLocal === 2 && g === 1) tipo = 'doblete'

        const jugador = nombreAleatorio(rand)
        const evento = await engine.aplicarEventoEnVivo(
          partido.local.id, tipo,
          `${tipo === 'hat_trick' ? '🎩 Hat-trick' : tipo === 'doblete' ? '⚡ Doblete' : '⚽ Gol'} de ${jugador} — ${labelPartido}`,
          jugador
        )
        if (evento) {
          totalEventos++
          await broker.alertarPorEvento(
            partido.local.id, tipo, jugador,
            evento.impacto_precio, evento.precio_antes, evento.precio_despues
          )
        }
        // Solo registrar el evento de doblete/hat_trick una vez (ya engloba los goles)
        if (tipo !== 'gol') break
      }

      // ── Aplicar eventos: goles del equipo visitante
      for (let g = 0; g < golesVisitante; g++) {
        let tipo: TipoEvento = 'gol'
        if (golesVisitante === 3 && g === 2) tipo = 'hat_trick'
        else if (golesVisitante === 2 && g === 1) tipo = 'doblete'

        const jugador = nombreAleatorio(rand)
        const evento = await engine.aplicarEventoEnVivo(
          partido.visitante.id, tipo,
          `${tipo === 'hat_trick' ? '🎩 Hat-trick' : tipo === 'doblete' ? '⚡ Doblete' : '⚽ Gol'} de ${jugador} — ${labelPartido}`,
          jugador
        )
        if (evento) {
          totalEventos++
          await broker.alertarPorEvento(
            partido.visitante.id, tipo, jugador,
            evento.impacto_precio, evento.precio_antes, evento.precio_despues
          )
        }
        if (tipo !== 'gol') break
      }

      // ── Tarjeta roja local
      if (tarjetaLocal && idsDisponibles.has(partido.local.id)) {
        const jugador = nombreAleatorio(rand)
        const evento = await engine.aplicarEventoEnVivo(
          partido.local.id, 'tarjeta_roja',
          `🟥 Expulsado ${jugador} — ${labelPartido}`,
          jugador
        )
        if (evento) {
          totalEventos++
          await broker.alertarPorEvento(
            partido.local.id, 'tarjeta_roja', jugador,
            evento.impacto_precio, evento.precio_antes, evento.precio_despues
          )
        }
      }

      // ── Tarjeta roja visitante
      if (tarjetaVisitante && idsDisponibles.has(partido.visitante.id)) {
        const jugador = nombreAleatorio(rand)
        const evento = await engine.aplicarEventoEnVivo(
          partido.visitante.id, 'tarjeta_roja',
          `🟥 Expulsado ${jugador} — ${labelPartido}`,
          jugador
        )
        if (evento) {
          totalEventos++
          await broker.alertarPorEvento(
            partido.visitante.id, 'tarjeta_roja', jugador,
            evento.impacto_precio, evento.precio_antes, evento.precio_despues
          )
        }
      }

      // ── Goleada: penaliza al perdedor si la diferencia es ≥ 3
      if (diff >= 3 && perdedorId && idsDisponibles.has(perdedorId)) {
        const eventoGoleada = await engine.aplicarEventoEnVivo(
          perdedorId, 'goleada',
          `📉 Goleada — ${labelPartido}`
        )
        if (eventoGoleada) {
          totalEventos++
          await broker.alertarPorEvento(
            perdedorId, 'goleada', undefined,
            eventoGoleada.impacto_precio, eventoGoleada.precio_antes, eventoGoleada.precio_despues
          )
        }
      }

      // ── Empate: noticia neutra (pequeño ajuste por presión de mercado)
      // No aplicamos eventos extra en empates — el mercado queda estable.

      // ── Alerta global del partido al broker (resumen narrativo)
      const resultadoTexto = golesLocal === golesVisitante
        ? `⚖️ Empate ${golesLocal}-${golesVisitante}`
        : `${ganadorId === partido.local.id ? partido.local.nombre : partido.visitante.nombre} ganó ${Math.max(golesLocal, golesVisitante)}-${Math.min(golesLocal, golesVisitante)}`

      // Notificar a todos los usuarios del tenant con holdings en estos equipos
      const equiposEnPartido = [partido.local.id, partido.visitante.id]
      const { data: holdingsAfectados } = await supabase
        .from('holdings')
        .select('portfolio_id, team_id, acciones, portfolios(user_id)')
        .eq('tenant_id', tenant.id)
        .in('team_id', equiposEnPartido)
        .gt('acciones', 0)

      if (holdingsAfectados) {
        const notificados = new Set<string>()
        for (const h of holdingsAfectados) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userId = (h.portfolios as any)?.user_id
          if (!userId || notificados.has(userId)) continue
          notificados.add(userId)

          const esLocal = h.team_id === partido.local.id
          const golesMiEquipo = esLocal ? golesLocal : golesVisitante
          const golesRival = esLocal ? golesVisitante : golesLocal
          const nombreMiEquipo = esLocal ? partido.local.nombre : partido.visitante.nombre

          await engine.crearAlerta(
            userId, 'partido_amistoso',
            `⚽ Amistoso simulado: ${nombreMiEquipo} ${golesMiEquipo}-${golesRival} · ${resultadoTexto}`,
            h.team_id
          )
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    tenants: tenants.length,
    partidos: partidos.length,
    eventos_aplicados: totalEventos,
    resumen,
  })
}

export { handler as GET, handler as POST }
