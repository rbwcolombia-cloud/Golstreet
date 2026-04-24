// ============================================================
// GolStreet — Integración con API-Football
// Obtiene eventos en vivo y los traduce al formato del motor
// ============================================================

import type { TipoEvento } from '@/types'

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io'
const HEADERS = {
  'x-apisports-key': process.env.API_FOOTBALL_KEY ?? '',
}

// Mapeo de países a IDs de equipos en la app
// Actualizar con los IDs reales de API-Football cuando estén disponibles
const PAISES_A_CODIGO: Record<string, string> = {
  France:       'FRA',
  Spain:        'ESP',
  Argentina:    'ARG',
  Brazil:       'BRA',
  England:      'ENG',
  Colombia:     'COL',
  Morocco:      'MAR',
  Japan:        'JPN',
  Nigeria:      'NGA',
  Uzbekistan:   'UZB',
}

interface EventoAPIFootball {
  time: { elapsed: number; extra: number | null }
  type: string
  detail: string
  player: { name: string | null }
  team: { name: string }
}

interface PartidoEnVivo {
  fixture: { id: number; status: { short: string; elapsed: number | null } }
  teams: {
    home: { name: string; winner: boolean | null }
    away: { name: string; winner: boolean | null }
  }
  goals: { home: number; away: number }
  events?: EventoAPIFootball[]
}

// Traducir evento de API-Football a TipoEvento de GolStreet
function traducirEvento(
  evento: EventoAPIFootball,
  golesEquipoAnterior: number
): { tipo: TipoEvento; jugador?: string } | null {
  const tipo = evento.type.toLowerCase()
  const detalle = evento.detail.toLowerCase()
  const jugador = evento.player.name ?? undefined

  if (tipo === 'goal') {
    // Detectar si es doblete o hat-trick contando goles del mismo jugador en el partido
    return { tipo: 'gol', jugador }
  }

  if (tipo === 'card') {
    if (detalle.includes('red')) {
      return { tipo: 'tarjeta_roja', jugador }
    }
  }

  if (tipo === 'subst' && detalle.includes('injury')) {
    return { tipo: 'lesion_titular', jugador }
  }

  if (tipo === 'var' && detalle.includes('penalty') && detalle.includes('saved')) {
    return { tipo: 'atajada_penalti', jugador }
  }

  return null
}

export class APIFootball {
  // Obtener partidos en vivo del Mundial FIFA 2026
  async obtenerPartidosEnVivo(): Promise<PartidoEnVivo[]> {
    try {
      const res = await fetch(`${API_FOOTBALL_BASE}/fixtures?live=all&league=1&season=2026`, {
        headers: HEADERS,
        next: { revalidate: 30 },
      })

      if (!res.ok) return []

      const data = await res.json()
      return data.response ?? []
    } catch {
      return []
    }
  }

  // Obtener eventos de un partido específico
  async obtenerEventosPartido(fixtureId: number): Promise<EventoAPIFootball[]> {
    try {
      const res = await fetch(`${API_FOOTBALL_BASE}/fixtures/events?fixture=${fixtureId}`, {
        headers: HEADERS,
        next: { revalidate: 30 },
      })

      if (!res.ok) return []

      const data = await res.json()
      return data.response ?? []
    } catch {
      return []
    }
  }

  // Determinar si hay goleada (diferencia de 3+ goles)
  esGoleada(goles: { home: number; away: number }): { esGoleada: boolean; equipoGoleado: 'home' | 'away' | null } {
    const diff = Math.abs(goles.home - goles.away)
    if (diff >= 3) {
      return {
        esGoleada: true,
        equipoGoleado: goles.home > goles.away ? 'away' : 'home',
      }
    }
    return { esGoleada: false, equipoGoleado: null }
  }

  // Obtener código de país desde nombre de equipo
  obtenerCodigoPais(nombreEquipo: string): string | null {
    return PAISES_A_CODIGO[nombreEquipo] ?? null
  }

  // Procesar todos los partidos en vivo y devolver eventos para aplicar
  async obtenerEventosPendientes(): Promise<Array<{
    codigoPais: string
    tipo: TipoEvento
    jugador?: string
    descripcion: string
    fixtureId: string
  }>> {
    const partidos = await this.obtenerPartidosEnVivo()
    const eventosPendientes: Array<{
      codigoPais: string
      tipo: TipoEvento
      jugador?: string
      descripcion: string
      fixtureId: string
    }> = []

    for (const partido of partidos) {
      const statusActivo = ['1H', '2H', 'ET', 'P'].includes(partido.fixture.status.short)
      if (!statusActivo) continue

      const eventos = await this.obtenerEventosPartido(partido.fixture.id)
      const minutosJugados = partido.fixture.status.elapsed ?? 0

      // Solo eventos de los últimos 2 minutos (ya que el cron corre cada 2 min)
      const eventosRecientes = eventos.filter(e =>
        e.time.elapsed >= Math.max(1, minutosJugados - 2)
      )

      for (const evento of eventosRecientes) {
        const equipoNombre = evento.team.name
        const codigoPais = this.obtenerCodigoPais(equipoNombre)
        if (!codigoPais) continue

        const golesEquipo = equipoNombre === partido.teams.home.name ? partido.goals.home : partido.goals.away
        const traducido = traducirEvento(evento, golesEquipo)
        if (!traducido) continue

        eventosPendientes.push({
          codigoPais,
          tipo: traducido.tipo,
          jugador: traducido.jugador,
          descripcion: `${evento.detail} min ${evento.time.elapsed}'`,
          fixtureId: String(partido.fixture.id),
        })
      }

      // Verificar goleada al final
      const { esGoleada, equipoGoleado } = this.esGoleada(partido.goals)
      if (esGoleada && equipoGoleado) {
        const nombreGoleado = equipoGoleado === 'home' ? partido.teams.home.name : partido.teams.away.name
        const codigoGoleado = this.obtenerCodigoPais(nombreGoleado)
        if (codigoGoleado) {
          eventosPendientes.push({
            codigoPais: codigoGoleado,
            tipo: 'goleada',
            descripcion: `Goleada ${partido.goals.home}-${partido.goals.away}`,
            fixtureId: String(partido.fixture.id),
          })
        }
      }
    }

    return eventosPendientes
  }
}
