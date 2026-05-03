// ============================================================
// GolStreet — NewsAnalyst
// Analiza noticias deportivas con IA y aplica impacto al precio
// ============================================================

import Anthropic from '@anthropic-ai/sdk'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { MarketEngine } from './market-engine'
import type { AnalisisNoticias } from '@/types'

const SYSTEM_PROMPT = `Eres un analista financiero de fútbol del Mundial FIFA 2026.
Dado un titular deportivo, devuelve únicamente JSON con esta estructura exacta:
{
  "equipo_afectado": string (nombre del país en español),
  "jugador_afectado": string | null,
  "sentimiento": number (entre -1 y 1, donde -1 es muy negativo y 1 es muy positivo),
  "confianza": number (entre 0 y 1),
  "impacto_precio_porcentaje": number (entre -5 y 5),
  "razonamiento": string (máximo 100 caracteres en español)
}
IMPORTANTE: El impacto por noticias es leve (máximo ±5%). Los movimientos grandes
solo ocurren en partidos reales (goles, tarjetas, resultados).
Responde SOLO con el JSON. Sin markdown, sin explicaciones adicionales.`

const EQUIPOS_VALIDOS = [
  // Favoritos
  'Argentina', 'Francia', 'Inglaterra', 'España', 'Brasil', 'Alemania', 'Portugal',
  // Contendientes
  'Países Bajos', 'Bélgica', 'Italia', 'Colombia', 'Uruguay', 'Marruecos',
  'México', 'EE.UU.', 'Estados Unidos',
  // Competitivos
  'Croacia', 'Suiza', 'Dinamarca', 'Turquía', 'Senegal', 'Japón',
  'Corea del Sur', 'Austria', 'Ecuador', 'Irán', 'Australia', 'Egipto',
  'Canadá', 'Escocia', 'Nigeria', 'Costa de Marfil',
  // Alta volatilidad
  'Serbia', 'Argelia', 'Paraguay', 'Arabia Saudita', 'Camerún', 'Ghana',
  'Costa Rica', 'Uzbekistán',
  // Underdogs
  'Eslovaquia', 'Ucrania', 'Sudáfrica', 'Irak', 'Túnez', 'Mali',
  'Honduras', 'Panamá', 'Nueva Zelanda',
]

export class NewsAnalyst {
  private anthropic: Anthropic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: SupabaseClient<any>

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async analizarTitular(titular: string, fuente?: string, url?: string): Promise<AnalisisNoticias | null> {
    // Si no hay API key configurada, saltar silenciosamente
    if (!process.env.ANTHROPIC_API_KEY) return null

    try {
      const mensaje = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Titular: "${titular}"` }],
      })

      const textoRespuesta = mensaje.content[0].type === 'text' ? mensaje.content[0].text : null
      if (!textoRespuesta) return null

      const analisis: AnalisisNoticias = JSON.parse(textoRespuesta)

      // Validar estructura
      if (
        typeof analisis.sentimiento !== 'number' ||
        typeof analisis.confianza !== 'number' ||
        typeof analisis.impacto_precio_porcentaje !== 'number'
      ) {
        return null
      }

      // Guardar en news_feed
      await this.guardarNoticia(titular, fuente, url, analisis)

      return analisis
    } catch (error) {
      console.error('Error analizando titular:', error)
      return null
    }
  }

  private async guardarNoticia(
    titular: string,
    fuente: string | undefined,
    url: string | undefined,
    analisis: AnalisisNoticias,
  ): Promise<void> {
    // Buscar el equipo afectado en la base de datos
    const { data: team } = await this.supabase
      .from('teams')
      .select('id')
      .ilike('nombre', `%${analisis.equipo_afectado}%`)
      .single()

    await this.supabase.from('news_feed').insert({
      titular,
      fuente,
      url,
      puntaje_sentimiento: analisis.sentimiento,
      confianza: analisis.confianza,
      impacto_precio_pct: analisis.impacto_precio_porcentaje / 100,
      equipo_afectado: analisis.equipo_afectado,
      jugador_afectado: analisis.jugador_afectado,
      razonamiento: analisis.razonamiento,
      teams_afectados: team ? [team.id] : [],
      procesado: false,
      fecha_publicacion: new Date().toISOString(),
    })
  }

  // Procesar noticias pendientes y aplicar al mercado de todos los tenants
  async procesarNoticiasPendientes(): Promise<void> {
    // ── Gate pre-torneo ──────────────────────────────────────────────────
    // Las noticias se guardan en el feed para mostrarse en la UI,
    // pero los precios NO se mueven hasta que arranque el Mundial.
    const INICIO_MUNDIAL = new Date('2026-06-11T21:00:00Z')
    const mundialIniciado = new Date() >= INICIO_MUNDIAL
    // ────────────────────────────────────────────────────────────────────

    const { data: noticias } = await this.supabase
      .from('news_feed')
      .select('*')
      .eq('procesado', false)
      .order('fecha_creacion', { ascending: true })
      .limit(10)

    if (!noticias || noticias.length === 0) return

    // Obtener todos los tenants activos
    const { data: tenants } = await this.supabase
      .from('tenants')
      .select('id')
      .eq('mercado_activo', true)

    if (!tenants) return

    for (const noticia of noticias) {
      // Si el Mundial no ha iniciado, marcar procesada sin mover precios
      if (!mundialIniciado) {
        await this.marcarProcesada(noticia.id)
        continue
      }

      if (!noticia.teams_afectados || noticia.teams_afectados.length === 0) {
        await this.marcarProcesada(noticia.id)
        continue
      }

      // Aplicar impacto en cada tenant activo
      for (const tenant of tenants) {
        const engine = new MarketEngine(tenant.id)
        for (const teamId of noticia.teams_afectados) {
          await engine.aplicarSentimientoIA(
            teamId,
            noticia.puntaje_sentimiento,
            noticia.confianza,
            noticia.impacto_precio_pct,
          )
        }
      }

      await this.marcarProcesada(noticia.id)
    }
  }

  private async marcarProcesada(noticiaId: string): Promise<void> {
    await this.supabase
      .from('news_feed')
      .update({ procesado: true, procesado_en: new Date().toISOString() })
      .eq('id', noticiaId)
  }

  // Obtener noticias de RSS deportivos (simplificado sin API-Football)
  async obtenerNoticias(): Promise<string[]> {
    const titulares: string[] = []

    const feeds = [
      'https://www.espn.com/espn/rss/soccer/news',
      'https://feeds.bbci.co.uk/sport/football/rss.xml',
    ]

    for (const feedUrl of feeds) {
      try {
        const res = await fetch(feedUrl, { next: { revalidate: 300 } })
        const xml = await res.text()
        const matches = xml.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g) ?? []
        const extraidos = matches.slice(1, 6).map(m =>
          m.replace(/<title><!\[CDATA\[/, '').replace(/\]\]><\/title>/, '')
        )
        titulares.push(...extraidos)
      } catch {
        // Si el RSS falla, continuar con el siguiente
      }
    }

    return titulares
  }

  // Ciclo completo: obtener + analizar + procesar
  async ejecutarCicloCompleto(): Promise<void> {
    const titulares = await this.obtenerNoticias()

    for (const titular of titulares) {
      const equipoMencionado = EQUIPOS_VALIDOS.find(e =>
        titular.toLowerCase().includes(e.toLowerCase())
      )

      if (equipoMencionado) {
        await this.analizarTitular(titular)
      }
    }

    await this.procesarNoticiasPendientes()
  }
}
