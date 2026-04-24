// ============================================================
// GolStreet — Tipos TypeScript globales
// ============================================================

export type FactorRiesgo = 'bajo' | 'medio' | 'alto' | 'muy_alto'
export type FaseEquipo = 'grupos' | 'octavos' | 'cuartos' | 'semis' | 'final' | 'eliminado'
export type TipoTrade = 'compra' | 'venta_mercado' | 'venta_limite' | 'liquidacion' | 'dividendo'
export type EstadoTrade = 'ejecutado' | 'pendiente' | 'cancelado'
export type PerfilRiesgo = 'conservador' | 'moderado' | 'arriesgado'
export type TipoEvento =
  | 'gol'
  | 'doblete'
  | 'hat_trick'
  | 'tarjeta_roja'
  | 'tarjeta_roja_figura'
  | 'lesion_titular'
  | 'atajada_penalti'
  | 'goleada'
  | 'clasificacion'
  | 'eliminacion'
export type TipoAlerta =
  | 'partido_perdiendo'
  | 'tarjeta_roja_figura'
  | 'noticia_negativa'
  | 'coins_inactivos'
  | 'equipo_ganando'
  | 'eliminacion'
  | 'dividendo'

export interface Tenant {
  id: string
  nombre: string
  slug: string
  email_admin: string
  plan: 'gratuito' | 'pro' | 'enterprise'
  pozo_monto: number
  pozo_distribucion: DistribucionPozo[]
  coins_iniciales: number
  entrada_tardia: EntradaTardia
  pantalla_publica_activa: boolean
  modo_pantalla: 'mercado' | 'partido' | 'ranking'
  mercado_activo: boolean
  fecha_creacion: string
}

export interface DistribucionPozo {
  posicion?: number
  porcentaje: number
  fondo_liga?: boolean
}

export interface EntradaTardia {
  antes_octavos: number
  antes_cuartos: number
  semis_adelante: number | null
}

export interface Team {
  id: string
  nombre: string
  codigo_pais: string
  bandera_url: string
  precio_base: number
  precio_ipo: number
  factor_riesgo: FactorRiesgo
  coeficiente_volatilidad: number
  acciones_total: number
  fase_actual: FaseEquipo
  eliminado: boolean
  fecha_eliminacion?: string
}

export interface LeagueAsset {
  id: string
  tenant_id: string
  team_id: string
  precio_actual: number
  precio_apertura_dia: number
  acciones_disponibles: number
  acciones_en_circulacion: number
  mercado_pausado: boolean
  pausa_hasta?: string
  ultimo_update: string
  team?: Team
}

export interface Portfolio {
  id: string
  user_id: string
  tenant_id: string
  saldo_coins: number
  perfil_riesgo: PerfilRiesgo
  coins_iniciales: number
  ultimo_acceso: string
  fecha_creacion: string
}

export interface Holding {
  id: string
  portfolio_id: string
  tenant_id: string
  team_id: string
  acciones: number
  precio_promedio_compra: number
  team?: Team
  precio_actual?: number
}

export interface Trade {
  id: string
  portfolio_id: string
  tenant_id: string
  team_id: string
  tipo: TipoTrade
  acciones: number
  precio_operacion: number
  precio_limite?: number
  comision: number
  estado: EstadoTrade
  motivo?: string
  timestamp: string
  team?: Team
}

export interface PriceHistory {
  id: string
  tenant_id: string
  team_id: string
  precio: number
  precio_open: number
  precio_high: number
  precio_low: number
  precio_close: number
  volumen: number
  timestamp: string
  motivo?: string
}

export interface MarketEvent {
  id: string
  tenant_id: string
  team_id: string
  tipo: TipoEvento
  descripcion?: string
  jugador_nombre?: string
  puntaje_sentimiento?: number
  impacto_precio: number
  precio_antes: number
  precio_despues: number
  partido_id?: string
  timestamp: string
  team?: Team
}

export interface NewsFeed {
  id: string
  titular: string
  fuente?: string
  url?: string
  puntaje_sentimiento: number
  confianza: number
  impacto_precio_pct: number
  equipo_afectado?: string
  jugador_afectado?: string
  razonamiento?: string
  teams_afectados: string[]
  procesado: boolean
  procesado_en?: string
  fecha_publicacion?: string
}

export interface Checkpoint {
  id: string
  tenant_id: string
  numero: 1 | 2 | 3
  nombre: string
  fecha?: string
  ejecutado: boolean
  ranking_snapshot?: LeaderboardEntry[]
  fecha_ejecucion?: string
}

export interface AlertLog {
  id: string
  user_id: string
  tenant_id: string
  tipo: TipoAlerta
  mensaje: string
  opciones?: OpcionAlerta[]
  team_id?: string
  leida: boolean
  accion_tomada?: string
  timestamp: string
  team?: Team
}

export interface OpcionAlerta {
  texto: string
  accion: string
  estilo: 'primario' | 'secundario' | 'peligro'
}

export interface LimitOrder {
  id: string
  portfolio_id: string
  tenant_id: string
  team_id: string
  acciones: number
  precio_minimo: number
  estado: 'activa' | 'ejecutada' | 'cancelada'
  trade_id?: string
  fecha_creacion: string
  fecha_expiracion?: string
  team?: Team
}

export interface LeaderboardEntry {
  posicion: number
  user_id: string
  nombre: string
  valor_total: number
  ganancia_pct: number
}

// ============================================================
// Tipos del MarketEngine
// ============================================================

export interface ResultadoCalculoPrecio {
  precio_nuevo: number
  precio_anterior: number
  delta_porcentaje: number
  factores: FactoresCalculo
}

export interface FactoresCalculo {
  precio_base: number
  delta_demanda: number
  sentimiento_ia: number
  multiplicador_evento: number
}

export interface ParametrosTrade {
  portfolio_id: string
  tenant_id: string
  team_id: string
  acciones: number
  tipo: TipoTrade
  precio_limite?: number
}

export interface ResultadoTrade {
  exitoso: boolean
  trade?: Trade
  error?: string
  precio_ejecutado?: number
  total_coins?: number
  comision?: number
}

export interface AnalisisNoticias {
  equipo_afectado: string
  jugador_afectado: string | null
  sentimiento: number
  confianza: number
  impacto_precio_porcentaje: number
  razonamiento: string
}

export interface CandleData {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TickerItem {
  codigo_pais: string
  nombre: string
  precio_actual: number
  cambio_pct: number
  bandera_url: string
}
