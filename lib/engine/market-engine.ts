// ============================================================
// GolStreet — MarketEngine
// Motor central de precios por tenant
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type {
  Team,
  LeagueAsset,
  Trade,
  Holding,
  Portfolio,
  MarketEvent,
  TipoEvento,
  ParametrosTrade,
  ResultadoTrade,
  ResultadoCalculoPrecio,
  FactoresCalculo,
  FaseEquipo,
} from '@/types'

// Tabla de multiplicadores por evento en vivo
const MULTIPLICADORES_EVENTO: Record<TipoEvento, number> = {
  gol:                  0.08,
  doblete:              0.15,
  hat_trick:            0.30,
  tarjeta_roja:        -0.18,
  tarjeta_roja_figura: -0.28,
  lesion_titular:      -0.10,
  atajada_penalti:      0.12,
  goleada:             -0.35,
  clasificacion:        0.05,
  eliminacion:         -1.00,
}

// Porcentajes de liquidación por fase de eliminación
const LIQUIDACION_POR_FASE: Record<FaseEquipo, number> = {
  grupos:    0.20,
  octavos:   0.40,
  cuartos:   0.60,
  semis:     0.80,
  final:     0.95,
  eliminado: 0.20,
}

// Premios por avance de ronda (sobre la inversión)
const DIVIDENDOS_POR_CLASIFICACION: Record<string, number> = {
  octavos:  0.05,
  cuartos:  0.10,
  semis:    0.20,
  campeon:  0.50,
}

const COMISION_OPERACION = 0.02
const PRECIO_MIN_PORCENTAJE_IPO = 0.40
const MAX_SUBIDA_PARTIDO = 0.60
const MAX_BAJADA_PARTIDO = -0.50

export class MarketEngine {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: SupabaseClient<any>
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
    // Usar service role key para operaciones del motor (bypass RLS)
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // ============================================================
  // CÁLCULO AMM DE PRECIO
  // Precio = PrecioBase × (1 + 0.15 × ΔDemanda) × SentimientoIA × MultiplicadorEvento
  // ============================================================
  calcularPrecioAMM(
    precioBase: number,
    accionesCompradas: number,
    accionesVendidas: number,
    totalAcciones: number,
    sentimientoIA: number = 1.0,
    multiplicadorEvento: number = 1.0,
    precioIPO: number,
    factorRiesgo: string,
  ): ResultadoCalculoPrecio {
    const coeficienteVolatilidad = this.obtenerCoeficienteVolatilidad(factorRiesgo)

    const deltaDemanda = totalAcciones > 0
      ? (accionesCompradas - accionesVendidas) / totalAcciones
      : 0

    const factores: FactoresCalculo = {
      precio_base: precioBase,
      delta_demanda: deltaDemanda,
      sentimiento_ia: Math.max(0.7, Math.min(1.3, sentimientoIA)),
      multiplicador_evento: multiplicadorEvento,
    }

    let precioNuevo = precioBase
      * (1 + 0.15 * deltaDemanda * coeficienteVolatilidad)
      * factores.sentimiento_ia
      * multiplicadorEvento

    // Aplicar precio mínimo (40% del IPO)
    const precioMinimo = precioIPO * PRECIO_MIN_PORCENTAJE_IPO
    precioNuevo = Math.max(precioNuevo, precioMinimo)

    // Limitar movimiento máximo durante partidos
    const cambioMax = precioBase * (1 + MAX_SUBIDA_PARTIDO)
    const cambioMin = precioBase * (1 + MAX_BAJADA_PARTIDO)
    precioNuevo = Math.min(precioNuevo, cambioMax)
    precioNuevo = Math.max(precioNuevo, cambioMin)

    const deltaPorcentaje = ((precioNuevo - precioBase) / precioBase) * 100

    return {
      precio_nuevo: Math.round(precioNuevo * 100) / 100,
      precio_anterior: precioBase,
      delta_porcentaje: Math.round(deltaPorcentaje * 100) / 100,
      factores,
    }
  }

  private obtenerCoeficienteVolatilidad(factorRiesgo: string): number {
    const coeficientes: Record<string, number> = {
      bajo:     0.80,
      medio:    1.00,
      alto:     1.40,
      muy_alto: 2.00,
    }
    return coeficientes[factorRiesgo] ?? 1.0
  }

  // ============================================================
  // APLICAR EVENTO EN VIVO
  // ============================================================
  async aplicarEventoEnVivo(
    teamId: string,
    tipoEvento: TipoEvento,
    descripcion?: string,
    jugadorNombre?: string,
    partidoId?: string,
  ): Promise<MarketEvent | null> {
    const multiplicador = MULTIPLICADORES_EVENTO[tipoEvento]
    if (multiplicador === undefined) return null

    // Obtener asset actual del tenant
    const { data: asset } = await this.supabase
      .from('league_assets')
      .select('*, teams(*)')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
      .single()

    if (!asset) return null

    const precioAntes = asset.precio_actual
    const precioNuevo = Math.max(
      asset.precio_actual * (1 + multiplicador),
      asset.teams.precio_ipo * PRECIO_MIN_PORCENTAJE_IPO
    )

    // Actualizar precio en league_assets
    await this.supabase
      .from('league_assets')
      .update({
        precio_actual: Math.round(precioNuevo * 100) / 100,
        ultimo_update: new Date().toISOString(),
      })
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)

    // Registrar en price_history
    await this.supabase.from('price_history').insert({
      tenant_id: this.tenantId,
      team_id: teamId,
      precio: precioNuevo,
      precio_open: precioAntes,
      precio_high: Math.max(precioAntes, precioNuevo),
      precio_low: Math.min(precioAntes, precioNuevo),
      precio_close: precioNuevo,
      motivo: 'evento_vivo',
    })

    // Registrar el evento
    const { data: evento } = await this.supabase
      .from('market_events')
      .insert({
        tenant_id: this.tenantId,
        team_id: teamId,
        tipo: tipoEvento,
        descripcion,
        jugador_nombre: jugadorNombre,
        impacto_precio: multiplicador,
        precio_antes: precioAntes,
        precio_despues: Math.round(precioNuevo * 100) / 100,
        partido_id: partidoId,
        puntaje_sentimiento: multiplicador > 0 ? 0.8 : -0.8,
      })
      .select()
      .single()

    // Si es eliminación, procesar liquidación automática
    if (tipoEvento === 'eliminacion') {
      await this.procesarLiquidacion(teamId, asset.teams.fase_actual)
    }

    return evento
  }

  // ============================================================
  // PROCESAR LIQUIDACIÓN AUTOMÁTICA POR ELIMINACIÓN
  // ============================================================
  async procesarLiquidacion(teamId: string, faseEliminacion: FaseEquipo): Promise<void> {
    const porcentajeLiquidacion = LIQUIDACION_POR_FASE[faseEliminacion] ?? 0.20

    // Obtener todos los holdings de este equipo en el tenant
    const { data: holdings } = await this.supabase
      .from('holdings')
      .select('*, portfolios(*)')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
      .gt('acciones', 0)

    if (!holdings || holdings.length === 0) return

    // Obtener precio actual
    const { data: asset } = await this.supabase
      .from('league_assets')
      .select('precio_actual')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
      .single()

    const precioLiquidacion = asset
      ? asset.precio_actual * porcentajeLiquidacion
      : 0

    for (const holding of holdings) {
      if (holding.acciones === 0) continue

      const coinsRecibidos = holding.acciones * precioLiquidacion

      // Crear trade de liquidación
      await this.supabase.from('trades').insert({
        portfolio_id: holding.portfolio_id,
        tenant_id: this.tenantId,
        team_id: teamId,
        tipo: 'liquidacion',
        acciones: holding.acciones,
        precio_operacion: precioLiquidacion,
        comision: 0,
        estado: 'ejecutado',
        motivo: `Liquidación automática — eliminado en ${faseEliminacion} (${(porcentajeLiquidacion * 100).toFixed(0)}%)`,
      })

      // Actualizar saldo del portfolio
      await this.supabase
        .from('portfolios')
        .update({ saldo_coins: holding.portfolios.saldo_coins + coinsRecibidos })
        .eq('id', holding.portfolio_id)

      // Limpiar el holding
      await this.supabase
        .from('holdings')
        .update({ acciones: 0 })
        .eq('id', holding.id)

      // Crear alerta para el usuario
      await this.crearAlerta(
        holding.portfolios.user_id,
        'eliminacion',
        `Tu equipo fue eliminado. Recibiste $${coinsRecibidos.toFixed(0)} coins de liquidación automática.`,
        teamId
      )
    }

    // Cerrar el mercado para este equipo
    await this.supabase
      .from('league_assets')
      .update({ mercado_pausado: true })
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)

    // Marcar equipo como eliminado (tabla global)
    await this.supabase
      .from('teams')
      .update({ eliminado: true, fase_actual: 'eliminado', fecha_eliminacion: new Date().toISOString() })
      .eq('id', teamId)
  }

  // ============================================================
  // APLICAR DIVIDENDOS POR CLASIFICACIÓN
  // ============================================================
  async aplicarDividendosPorClasificacion(
    teamId: string,
    nuevaFase: 'octavos' | 'cuartos' | 'semis' | 'campeon',
  ): Promise<void> {
    const porcentajeDividendo = DIVIDENDOS_POR_CLASIFICACION[nuevaFase] ?? 0

    const { data: holdings } = await this.supabase
      .from('holdings')
      .select('*, portfolios(*)')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
      .gt('acciones', 0)

    if (!holdings) return

    for (const holding of holdings) {
      const inversionOriginal = holding.acciones * holding.precio_promedio_compra
      const dividendo = inversionOriginal * porcentajeDividendo

      // Acreditar dividendo al saldo
      await this.supabase
        .from('portfolios')
        .update({ saldo_coins: holding.portfolios.saldo_coins + dividendo })
        .eq('id', holding.portfolio_id)

      // Registrar como trade de dividendo
      await this.supabase.from('trades').insert({
        portfolio_id: holding.portfolio_id,
        tenant_id: this.tenantId,
        team_id: teamId,
        tipo: 'dividendo',
        acciones: holding.acciones,
        precio_operacion: holding.precio_promedio_compra * porcentajeDividendo,
        comision: 0,
        estado: 'ejecutado',
        motivo: `Premio por Avance — clasificación a ${nuevaFase} (+${(porcentajeDividendo * 100).toFixed(0)}%)`,
      })

      // Crear alerta de dividendo
      await this.crearAlerta(
        holding.portfolios.user_id,
        'dividendo',
        `¡Premio por Avance! Tu equipo clasificó a ${nuevaFase} y recibiste $${dividendo.toFixed(0)} coins extra.`,
        teamId
      )
    }

    // Actualizar fase del equipo
    const faseMap: Record<string, FaseEquipo> = {
      octavos: 'octavos',
      cuartos: 'cuartos',
      semis: 'semis',
      campeon: 'final',
    }
    await this.supabase
      .from('teams')
      .update({ fase_actual: faseMap[nuevaFase] })
      .eq('id', teamId)
  }

  // ============================================================
  // EJECUTAR TRADE DE COMPRA
  // ============================================================
  async ejecutarCompra(params: ParametrosTrade): Promise<ResultadoTrade> {
    const { portfolio_id, team_id, acciones } = params

    // Verificar que el mercado esté activo
    const { data: asset } = await this.supabase
      .from('league_assets')
      .select('*, teams(*)')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', team_id)
      .single()

    if (!asset) return { exitoso: false, error: 'Equipo no encontrado en este mercado' }
    if (asset.mercado_pausado) return { exitoso: false, error: 'El mercado está pausado para este equipo. Comienza el partido en breve.' }
    if (asset.acciones_disponibles < acciones) return { exitoso: false, error: `Solo quedan ${asset.acciones_disponibles} partes disponibles` }

    // Obtener portfolio
    const { data: portfolio } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolio_id)
      .single()

    if (!portfolio) return { exitoso: false, error: 'Portafolio no encontrado' }

    const precioActual = asset.precio_actual
    const comision = acciones * precioActual * COMISION_OPERACION
    const totalCost = acciones * precioActual + comision

    if (portfolio.saldo_coins < totalCost) {
      return {
        exitoso: false,
        error: `Monedas insuficientes. Necesitas $${totalCost.toFixed(2)} y tienes $${portfolio.saldo_coins.toFixed(2)}`
      }
    }

    // Ejecutar compra
    const { data: trade } = await this.supabase
      .from('trades')
      .insert({
        portfolio_id,
        tenant_id: this.tenantId,
        team_id,
        tipo: 'compra',
        acciones,
        precio_operacion: precioActual,
        comision,
        estado: 'ejecutado',
      })
      .select()
      .single()

    // Actualizar saldo
    await this.supabase
      .from('portfolios')
      .update({
        saldo_coins: portfolio.saldo_coins - totalCost,
        ultimo_acceso: new Date().toISOString(),
      })
      .eq('id', portfolio_id)

    // Actualizar o crear holding
    const { data: holdingExistente } = await this.supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolio_id)
      .eq('team_id', team_id)
      .single()

    if (holdingExistente) {
      const totalAcciones = holdingExistente.acciones + acciones
      const precioPromedio = (
        (holdingExistente.acciones * holdingExistente.precio_promedio_compra) +
        (acciones * precioActual)
      ) / totalAcciones

      await this.supabase
        .from('holdings')
        .update({ acciones: totalAcciones, precio_promedio_compra: precioPromedio })
        .eq('id', holdingExistente.id)
    } else {
      await this.supabase.from('holdings').insert({
        portfolio_id,
        tenant_id: this.tenantId,
        team_id,
        acciones,
        precio_promedio_compra: precioActual,
      })
    }

    // Actualizar acciones disponibles y recalcular precio por demanda
    await this.supabase
      .from('league_assets')
      .update({
        acciones_disponibles: asset.acciones_disponibles - acciones,
        acciones_en_circulacion: asset.acciones_en_circulacion + acciones,
        ultimo_update: new Date().toISOString(),
      })
      .eq('tenant_id', this.tenantId)
      .eq('team_id', team_id)

    // Actualizar precio por demanda
    await this.actualizarPrecioPorDemanda(team_id, asset)

    return {
      exitoso: true,
      trade,
      precio_ejecutado: precioActual,
      total_coins: totalCost,
      comision,
    }
  }

  // ============================================================
  // EJECUTAR TRADE DE VENTA AL MERCADO
  // ============================================================
  async ejecutarVentaMercado(params: ParametrosTrade): Promise<ResultadoTrade> {
    const { portfolio_id, team_id, acciones } = params

    const { data: asset } = await this.supabase
      .from('league_assets')
      .select('*, teams(*)')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', team_id)
      .single()

    if (!asset) return { exitoso: false, error: 'Equipo no encontrado' }
    if (asset.mercado_pausado) return { exitoso: false, error: 'Mercado pausado antes del partido' }

    const { data: holding } = await this.supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolio_id)
      .eq('team_id', team_id)
      .single()

    if (!holding || holding.acciones < acciones) {
      return { exitoso: false, error: 'No tienes suficientes partes de este equipo' }
    }

    const { data: portfolio } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolio_id)
      .single()

    if (!portfolio) return { exitoso: false, error: 'Portafolio no encontrado' }

    const precioActual = asset.precio_actual
    const comision = acciones * precioActual * COMISION_OPERACION
    const totalRecibido = acciones * precioActual - comision

    const { data: trade } = await this.supabase
      .from('trades')
      .insert({
        portfolio_id,
        tenant_id: this.tenantId,
        team_id,
        tipo: 'venta_mercado',
        acciones,
        precio_operacion: precioActual,
        comision,
        estado: 'ejecutado',
      })
      .select()
      .single()

    // Actualizar saldo del portfolio
    await this.supabase
      .from('portfolios')
      .update({
        saldo_coins: portfolio.saldo_coins + totalRecibido,
        ultimo_acceso: new Date().toISOString(),
      })
      .eq('id', portfolio_id)

    // Actualizar holding
    const accionesRestantes = holding.acciones - acciones
    if (accionesRestantes === 0) {
      await this.supabase.from('holdings').delete().eq('id', holding.id)
    } else {
      await this.supabase
        .from('holdings')
        .update({ acciones: accionesRestantes })
        .eq('id', holding.id)
    }

    // Actualizar acciones disponibles
    await this.supabase
      .from('league_assets')
      .update({
        acciones_disponibles: asset.acciones_disponibles + acciones,
        acciones_en_circulacion: asset.acciones_en_circulacion - acciones,
        ultimo_update: new Date().toISOString(),
      })
      .eq('tenant_id', this.tenantId)
      .eq('team_id', team_id)

    // Recalcular precio por menor demanda
    await this.actualizarPrecioPorDemanda(team_id, asset)

    return {
      exitoso: true,
      trade,
      precio_ejecutado: precioActual,
      total_coins: totalRecibido,
      comision,
    }
  }

  // ============================================================
  // CREAR ORDEN DE VENTA CON PRECIO MÍNIMO (Limit Order)
  // ============================================================
  async crearOrdenLimite(params: ParametrosTrade): Promise<ResultadoTrade> {
    const { portfolio_id, team_id, acciones, precio_limite } = params

    if (!precio_limite) return { exitoso: false, error: 'Debes indicar un precio mínimo' }

    const { data: holding } = await this.supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', portfolio_id)
      .eq('team_id', team_id)
      .single()

    if (!holding || holding.acciones < acciones) {
      return { exitoso: false, error: 'No tienes suficientes partes de este equipo' }
    }

    const { data: asset } = await this.supabase
      .from('league_assets')
      .select('precio_actual')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', team_id)
      .single()

    // Si el precio actual ya cumple el límite, ejecutar inmediatamente
    if (asset && asset.precio_actual >= precio_limite) {
      return this.ejecutarVentaMercado(params)
    }

    // Registrar orden de límite
    await this.supabase.from('limit_orders').insert({
      portfolio_id,
      tenant_id: this.tenantId,
      team_id,
      acciones,
      precio_minimo: precio_limite,
      estado: 'activa',
    })

    return {
      exitoso: true,
      precio_ejecutado: precio_limite,
      total_coins: acciones * precio_limite,
    }
  }

  // ============================================================
  // ACTUALIZAR PRECIO POR DEMANDA (AMM puro)
  // ============================================================
  async actualizarPrecioPorDemanda(teamId: string, asset: LeagueAsset & { teams: Team }): Promise<void> {
    const { data: stats } = await this.supabase.rpc('get_trade_stats_team', {
      p_tenant_id: this.tenantId,
      p_team_id: teamId,
    })

    const accionesCompradas = stats?.acciones_compradas ?? 0
    const accionesVendidas = stats?.acciones_vendidas ?? 0
    const totalAcciones = asset.teams.acciones_total

    const resultado = this.calcularPrecioAMM(
      asset.precio_actual,
      accionesCompradas,
      accionesVendidas,
      totalAcciones,
      1.0,
      1.0,
      asset.teams.precio_ipo,
      asset.teams.factor_riesgo,
    )

    if (Math.abs(resultado.delta_porcentaje) > 0.01) {
      await this.supabase
        .from('league_assets')
        .update({
          precio_actual: resultado.precio_nuevo,
          ultimo_update: new Date().toISOString(),
        })
        .eq('tenant_id', this.tenantId)
        .eq('team_id', teamId)

      await this.supabase.from('price_history').insert({
        tenant_id: this.tenantId,
        team_id: teamId,
        precio: resultado.precio_nuevo,
        precio_open: asset.precio_actual,
        precio_high: Math.max(asset.precio_actual, resultado.precio_nuevo),
        precio_low: Math.min(asset.precio_actual, resultado.precio_nuevo),
        precio_close: resultado.precio_nuevo,
        motivo: 'demanda',
      })
    }
  }

  // ============================================================
  // PAUSAR MERCADO (5 min antes del partido)
  // ============================================================
  async pausarMercadoEquipo(teamId: string, minutosAntes: number = 5): Promise<void> {
    const pausaHasta = new Date(Date.now() + minutosAntes * 60 * 1000)
    await this.supabase
      .from('league_assets')
      .update({
        mercado_pausado: true,
        pausa_hasta: pausaHasta.toISOString(),
      })
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
  }

  async reanudarMercadoEquipo(teamId: string): Promise<void> {
    await this.supabase
      .from('league_assets')
      .update({
        mercado_pausado: false,
        pausa_hasta: null,
      })
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
  }

  // ============================================================
  // INICIALIZAR MERCADO DE UN TENANT
  // Crea los league_assets para todos los equipos
  // ============================================================
  async inicializarMercado(): Promise<void> {
    const { data: teams } = await this.supabase.from('teams').select('*')
    if (!teams) return

    const assets = teams.map((team: Team) => ({
      tenant_id: this.tenantId,
      team_id: team.id,
      precio_actual: team.precio_base,
      precio_apertura_dia: team.precio_base,
      acciones_disponibles: team.acciones_total,
      acciones_en_circulacion: 0,
      mercado_pausado: false,
    }))

    await this.supabase
      .from('league_assets')
      .upsert(assets, { onConflict: 'tenant_id,team_id' })
  }

  // ============================================================
  // PROCESAR ÓRDENES LÍMITE PENDIENTES
  // ============================================================
  async procesarOrdenesLimitePendientes(): Promise<void> {
    const { data: ordenes } = await this.supabase
      .from('limit_orders')
      .select('*, league_assets!inner(precio_actual)')
      .eq('tenant_id', this.tenantId)
      .eq('estado', 'activa')

    if (!ordenes) return

    for (const orden of ordenes) {
      const precioActual = orden.league_assets?.precio_actual ?? 0
      if (precioActual >= orden.precio_minimo) {
        await this.ejecutarVentaMercado({
          portfolio_id: orden.portfolio_id,
          tenant_id: this.tenantId,
          team_id: orden.team_id,
          acciones: orden.acciones,
          tipo: 'venta_limite',
        })

        await this.supabase
          .from('limit_orders')
          .update({ estado: 'ejecutada' })
          .eq('id', orden.id)
      }
    }
  }

  // ============================================================
  // CREAR PORTFOLIO INICIAL CON PERFIL ELEGIDO
  // ============================================================
  async crearPortfolioInicial(
    userId: string,
    perfilRiesgo: 'conservador' | 'moderado' | 'arriesgado',
    coinsIniciales: number = 10000,
  ): Promise<void> {
    // Crear portfolio
    const { data: portfolio } = await this.supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        tenant_id: this.tenantId,
        saldo_coins: coinsIniciales,
        perfil_riesgo: perfilRiesgo,
        coins_iniciales: coinsIniciales,
      })
      .select()
      .single()

    if (!portfolio) return

    // Distribución de portafolios predeterminados
    const distribuciones: Record<string, Array<{ codigo: string; porcentaje: number }>> = {
      conservador: [
        { codigo: 'FRA', porcentaje: 0.30 },
        { codigo: 'ESP', porcentaje: 0.30 },
        { codigo: 'ARG', porcentaje: 0.25 },
        { codigo: 'BRA', porcentaje: 0.15 },
      ],
      moderado: [
        { codigo: 'ESP', porcentaje: 0.25 },
        { codigo: 'BRA', porcentaje: 0.20 },
        { codigo: 'COL', porcentaje: 0.30 },
        { codigo: 'MAR', porcentaje: 0.25 },
      ],
      arriesgado: [
        { codigo: 'COL', porcentaje: 0.35 },
        { codigo: 'UZB', porcentaje: 0.25 },
        { codigo: 'NGA', porcentaje: 0.25 },
        { codigo: 'JPN', porcentaje: 0.15 },
      ],
    }

    const distribucion = distribuciones[perfilRiesgo]

    // Obtener equipos por código de país
    for (const item of distribucion) {
      const { data: team } = await this.supabase
        .from('teams')
        .select('*')
        .eq('codigo_pais', item.codigo)
        .single()

      if (!team) continue

      const { data: asset } = await this.supabase
        .from('league_assets')
        .select('precio_actual, acciones_disponibles')
        .eq('tenant_id', this.tenantId)
        .eq('team_id', team.id)
        .single()

      if (!asset) continue

      const coinsAsignar = coinsIniciales * item.porcentaje
      const accionesAComprar = Math.floor(coinsAsignar / asset.precio_actual)

      if (accionesAComprar > 0) {
        await this.ejecutarCompra({
          portfolio_id: portfolio.id,
          tenant_id: this.tenantId,
          team_id: team.id,
          acciones: accionesAComprar,
          tipo: 'compra',
        })
      }
    }
  }

  // ============================================================
  // CREAR ALERTA BROKER PERSONAL
  // ============================================================
  async crearAlerta(
    userId: string,
    tipo: string,
    mensaje: string,
    teamId?: string,
    opciones?: Array<{ texto: string; accion: string; estilo: string }>
  ): Promise<void> {
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

  // ============================================================
  // EJECUTAR CHECKPOINT (Día de Cobro)
  // ============================================================
  async ejecutarCheckpoint(numero: 1 | 2 | 3): Promise<void> {
    const { data: rankingRaw } = await this.supabase.rpc('get_leaderboard', {
      p_tenant_id: this.tenantId,
      p_limit: 1000,
    })

    await this.supabase
      .from('checkpoints')
      .upsert({
        tenant_id: this.tenantId,
        numero,
        nombre: `Día de Cobro ${numero}`,
        ejecutado: true,
        ranking_snapshot: rankingRaw ?? [],
        fecha_ejecucion: new Date().toISOString(),
      }, { onConflict: 'tenant_id,numero' })

    // Checkpoint 3 cierra el mercado definitivamente
    if (numero === 3) {
      await this.supabase
        .from('tenants')
        .update({ mercado_activo: false })
        .eq('id', this.tenantId)
    }
  }

  // ============================================================
  // APLICAR SENTIMIENTO IA AL PRECIO
  // ============================================================
  async aplicarSentimientoIA(
    teamId: string,
    sentimiento: number,
    confianza: number,
    impactoPct: number,
  ): Promise<void> {
    const { data: asset } = await this.supabase
      .from('league_assets')
      .select('*, teams(*)')
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)
      .single()

    if (!asset) return

    // El sentimiento ajustado va de 0.7 a 1.3
    const sentimientoNormalizado = 1 + (sentimiento * confianza * 0.3)
    const sentimientoAjustado = Math.max(0.7, Math.min(1.3, sentimientoNormalizado))

    const precioNuevo = asset.precio_actual * sentimientoAjustado
    const precioMin = asset.teams.precio_ipo * PRECIO_MIN_PORCENTAJE_IPO

    await this.supabase
      .from('league_assets')
      .update({
        precio_actual: Math.max(precioMin, Math.round(precioNuevo * 100) / 100),
        ultimo_update: new Date().toISOString(),
      })
      .eq('tenant_id', this.tenantId)
      .eq('team_id', teamId)

    await this.supabase.from('price_history').insert({
      tenant_id: this.tenantId,
      team_id: teamId,
      precio: precioNuevo,
      precio_open: asset.precio_actual,
      precio_high: Math.max(asset.precio_actual, precioNuevo),
      precio_low: Math.min(asset.precio_actual, precioNuevo),
      precio_close: precioNuevo,
      motivo: 'noticia',
    })
  }
}
