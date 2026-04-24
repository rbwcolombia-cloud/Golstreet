// ============================================================
// GolStreet — BrokerAlertas
// Detecta situaciones clave y genera alertas para el usuario
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface HoldingConPrecio {
  portfolio_id: string
  team_id: string
  acciones: number
  precio_promedio_compra: number
  precio_actual: number
  user_id: string
  saldo_coins: number
}

export class BrokerAlertas {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: SupabaseClient<any>
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // Detectar coins inactivos por más de 2 días y generar alerta
  async verificarCoinsInactivos(): Promise<void> {
    const { data: portfolios } = await this.supabase
      .from('portfolios')
      .select('id, user_id, saldo_coins, ultimo_acceso')
      .eq('tenant_id', this.tenantId)
      .gt('saldo_coins', 500)

    if (!portfolios) return

    for (const p of portfolios) {
      const diasInactivo = Math.floor(
        (Date.now() - new Date(p.ultimo_acceso).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diasInactivo >= 2) {
        // Encontrar el equipo que más subió en las últimas 24h
        const { data: topEquipo } = await this.supabase
          .from('league_assets')
          .select('*, teams(nombre)')
          .eq('tenant_id', this.tenantId)
          .order('ultimo_update', { ascending: false })
          .limit(1)
          .single()

        const nombreEquipo = topEquipo?.teams?.nombre ?? 'un equipo'

        await this.crearAlertaSiNoExiste(p.user_id, 'coins_inactivos',
          `Tienes $${Math.floor(p.saldo_coins).toLocaleString('es-CO')} monedas sin trabajar desde hace ${diasInactivo} días. Mientras tanto ${nombreEquipo} sigue moviéndose. ¿Las ponemos a trabajar?`,
          undefined,
          [
            { texto: 'Ver el mercado', accion: 'ver_mercado', estilo: 'primario' },
            { texto: 'Después', accion: 'ignorar', estilo: 'secundario' },
          ]
        )
      }
    }
  }

  // Alertas por evento de partido (llamado desde el MarketEngine al aplicar evento)
  async alertarPorEvento(
    teamId: string,
    tipoEvento: string,
    jugadorNombre: string | undefined,
    impactoPrecio: number,
    precioAntes: number,
    precioAhora: number,
  ): Promise<void> {
    // Obtener usuarios con partes de este equipo
    const { data: holdings } = await this.supabase
      .from('holdings')
      .select('*, portfolios(user_id, saldo_coins)')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
      .gt('acciones', 0)

    if (!holdings) return

    for (const h of holdings) {
      const userId = h.portfolios?.user_id
      if (!userId) continue

      const valorInvertido = h.acciones * h.precio_promedio_compra
      const valorActual = h.acciones * precioAhora
      const gananciaActual = valorActual - valorInvertido
      const coinsRecuperablesAhora = valorActual * 0.98

      if (tipoEvento === 'tarjeta_roja_figura' && jugadorNombre) {
        const perdidaCoins = Math.abs(h.acciones * (precioAntes - precioAhora))
        await this.crearAlertaSiNoExiste(userId, 'tarjeta_roja_figura',
          `${jugadorNombre} fue expulsado. Tu equipo bajó $${Math.floor(perdidaCoins).toLocaleString('es-CO')} coins. Los equipos con 10 jugadores pierden el 70% de las veces. ¿Qué decides?`,
          teamId,
          [
            { texto: 'Vender ahora', accion: 'ver_equipo', estilo: 'peligro' },
            { texto: 'Confío en el equipo', accion: 'ignorar', estilo: 'secundario' },
          ]
        )
      }

      if (tipoEvento === 'gol' && impactoPrecio > 0) {
        if (gananciaActual > 0 && gananciaActual > valorInvertido * 0.10) {
          await this.crearAlertaSiNoExiste(userId, 'equipo_ganando',
            `Tu equipo está ganando y tu inversión subió $${Math.floor(gananciaActual).toLocaleString('es-CO')} desde que compraste. ¿Aseguras la ganancia o esperas más?`,
            teamId,
            [
              { texto: `Vender y asegurar $${Math.floor(coinsRecuperablesAhora).toLocaleString('es-CO')}`, accion: 'ver_equipo', estilo: 'primario' },
              { texto: 'Mantener', accion: 'ignorar', estilo: 'secundario' },
            ]
          )
        }
      }
    }
  }

  // Alerta cuando el partido va perdiendo con tiempo casi acabado
  async alertarPartidoPerdiendo(
    teamId: string,
    minutosRestantes: number,
  ): Promise<void> {
    if (minutosRestantes > 15) return

    const { data: holdings } = await this.supabase
      .from('holdings')
      .select('*, portfolios(user_id), league_assets!inner(precio_actual)')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
      .gt('acciones', 0)

    if (!holdings) return

    for (const h of holdings) {
      const userId = h.portfolios?.user_id
      if (!userId) continue

      const precioActual = h.league_assets?.[0]?.precio_actual ?? h.precio_promedio_compra
      const valorRecuperable = Math.floor(h.acciones * precioActual * 0.98)
      const inversionOriginal = Math.floor(h.acciones * h.precio_promedio_compra)

      await this.crearAlertaSiNoExiste(userId, 'partido_perdiendo',
        `Tu equipo va perdiendo con ${minutosRestantes} min restantes. Si vendes ahora recuperas $${valorRecuperable.toLocaleString('es-CO')} de los $${inversionOriginal.toLocaleString('es-CO')} que invertiste. ¿Qué hacemos?`,
        teamId,
        [
          { texto: `Vender y recuperar $${valorRecuperable.toLocaleString('es-CO')}`, accion: 'ver_equipo', estilo: 'peligro' },
          { texto: 'Aguantar y arriesgar', accion: 'ignorar', estilo: 'secundario' },
        ]
      )
    }
  }

  // Alerta por noticia negativa detectada por IA
  async alertarNoticiaNegativa(
    teamId: string,
    titular: string,
    nombreEquipo: string,
  ): Promise<void> {
    const { data: holdings } = await this.supabase
      .from('holdings')
      .select('portfolios(user_id)')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
      .gt('acciones', 0)

    if (!holdings) return

    const usuariosNotificados = new Set<string>()

    for (const h of holdings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (h.portfolios as any)?.user_id
      if (!userId || usuariosNotificados.has(userId)) continue
      usuariosNotificados.add(userId)

      await this.crearAlertaSiNoExiste(userId, 'noticia_negativa',
        `Última hora: "${titular}". Esto podría afectar a ${nombreEquipo}. ¿Quieres proteger tu inversión?`,
        teamId,
        [
          { texto: 'Ver opciones', accion: 'ver_equipo', estilo: 'primario' },
          { texto: 'Ignorar', accion: 'ignorar', estilo: 'secundario' },
        ]
      )
    }
  }

  // Helper: crear alerta solo si no hay una igual sin leer en las últimas 2h
  private async crearAlertaSiNoExiste(
    userId: string,
    tipo: string,
    mensaje: string,
    teamId?: string,
    opciones?: Array<{ texto: string; accion: string; estilo: string }>
  ): Promise<void> {
    const dosHorasAtras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    const { data: existente } = await this.supabase
      .from('alerts_log')
      .select('id')
      .eq('user_id', userId)
      .eq('tenant_id', this.tenantId)
      .eq('tipo', tipo)
      .eq('leida', false)
      .gte('timestamp', dosHorasAtras)
      .single()

    if (existente) return

    await this.supabase.from('alerts_log').insert({
      user_id: userId,
      tenant_id: this.tenantId,
      tipo,
      mensaje,
      team_id: teamId,
      opciones,
      leida: false,
    })
  }

  // Ejecutar revisión completa del broker (llamado por cron)
  async ejecutarRevisionCompleta(): Promise<void> {
    await this.verificarCoinsInactivos()
  }
}
