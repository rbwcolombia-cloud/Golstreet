'use client'

import Link from 'next/link'
import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, ShoppingCart, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ResponsiveContainer, LineChart, Line, Tooltip, ReferenceLine } from 'recharts'
import type { LeagueAsset, Team } from '@/types'

interface TarjetaEquipoProps {
  asset: LeagueAsset & { team: Team }
}

const COLORES_RIESGO: Record<string, string> = {
  bajo:     'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
  medio:    'text-yellow-400 bg-yellow-950/40 border-yellow-800/60',
  alto:     'text-orange-400 bg-orange-950/40 border-orange-800/60',
  muy_alto: 'text-red-400 bg-red-950/40 border-red-800/60',
}
const ETIQUETAS_RIESGO: Record<string, string> = {
  bajo:     'Seguro',
  medio:    'Moderado',
  alto:     'Arriesgado',
  muy_alto: 'Especulativo',
}

/** Genera mini sparkline sintético a partir de apertura y precio actual */
function generarSparkline(apertura: number, actual: number, puntos = 10) {
  const datos: { v: number }[] = []
  for (let i = 0; i < puntos; i++) {
    const t = i / (puntos - 1)
    const ruido = (Math.sin(i * 2.5) * 0.3 + Math.cos(i * 1.7) * 0.2) * Math.abs(actual - apertura) * 0.4
    const base = apertura + (actual - apertura) * t
    datos.push({ v: Math.round(base + ruido) })
  }
  datos[datos.length - 1] = { v: actual }
  return datos
}

export function TarjetaEquipo({ asset }: TarjetaEquipoProps) {
  const [hovered, setHovered] = useState(false)

  const cambio    = ((asset.precio_actual - asset.precio_apertura_dia) / asset.precio_apertura_dia) * 100
  const esAlza    = cambio > 0
  const esBaja    = cambio < 0
  const sparkData = generarSparkline(asset.precio_apertura_dia, asset.precio_actual)

  const colorPrecio   = esAlza ? 'text-emerald-400' : esBaja ? 'text-red-400' : 'text-foreground'
  const colorCambio   = esAlza ? 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60'
                               : esBaja ? 'text-red-400 bg-red-950/50 border-red-800/60'
                               : 'text-muted-foreground bg-muted/30 border-border'
  const colorLinea    = esAlza ? '#22C55E' : esBaja ? '#EF4444' : '#94A3B8'
  const bordeHover    = esAlza ? 'hover:border-emerald-700/60 hover:shadow-emerald-900/20'
                               : esBaja ? 'hover:border-red-700/60 hover:shadow-red-900/20'
                               : 'hover:border-border/80'
  const IconoCambio   = esAlza ? TrendingUp : esBaja ? TrendingDown : Minus

  if (asset.team.eliminado) {
    return (
      <div className="bg-card/30 border border-border/40 rounded-2xl p-5 opacity-35 grayscale cursor-not-allowed">
        <div className="flex items-center gap-3">
          <img
            src={asset.team.bandera_url}
            alt={asset.team.nombre}
            className="w-12 h-8 object-cover rounded-lg"
          />
          <div>
            <p className="font-semibold text-muted-foreground text-sm">{asset.team.nombre}</p>
            <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
              <Lock size={10} aria-hidden="true" /> Eliminado
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/equipo/${asset.team_id}`} className="block cursor-pointer">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`group bg-card border border-border/70 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${bordeHover}`}
      >

        {/* ── Header: bandera + nombre + riesgo ── */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={asset.team.bandera_url}
                alt={asset.team.nombre}
                className="w-14 h-9 object-cover rounded-lg shadow-md"
              />
              {asset.mercado_pausado && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-background" title="Mercado pausado" />
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm leading-tight group-hover:text-white transition-colors">
                {asset.team.nombre}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono tracking-widest mt-0.5">
                {asset.team.codigo_pais}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] font-semibold border shrink-0 ${COLORES_RIESGO[asset.team.factor_riesgo]}`}
          >
            {ETIQUETAS_RIESGO[asset.team.factor_riesgo]}
          </Badge>
        </div>

        {/* ── Sparkline mini chart ── */}
        <div className="h-12 -mx-1 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={colorLinea}
                strokeWidth={hovered ? 1.8 : 1.4}
                dot={false}
                strokeOpacity={hovered ? 0.9 : 0.6}
              />
              <ReferenceLine
                y={asset.precio_apertura_dia}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              {hovered && (
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="bg-card border border-border rounded-lg px-2 py-1 shadow-lg">
                        <p className={`text-xs font-mono font-bold ${colorPrecio}`}>
                          ${payload[0].value?.toLocaleString('es-CO')}
                        </p>
                      </div>
                    )
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Precio + cambio ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className={`text-2xl font-mono font-bold leading-none tabular-nums ${colorPrecio}`}>
              ${asset.precio_actual.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              IPO{' '}
              <span className="font-mono text-muted-foreground/80">
                ${asset.team.precio_ipo.toLocaleString('es-CO')}
              </span>
            </p>
          </div>

          <div className="text-right flex flex-col items-end gap-1.5">
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${colorCambio}`}>
              <IconoCambio size={11} aria-hidden="true" />
              {cambio > 0 ? '+' : ''}{cambio.toFixed(2)}%
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ShoppingCart size={10} aria-hidden="true" />
              <span className="font-mono tabular-nums">{asset.acciones_disponibles.toLocaleString('es-CO')}</span>
              <span>disp.</span>
            </div>
          </div>
        </div>

        {/* ── Mercado pausado ── */}
        {asset.mercado_pausado && (
          <div className="mt-3 text-[11px] text-yellow-400 bg-yellow-950/30 border border-yellow-900/40 rounded-lg px-3 py-1.5 text-center font-medium flex items-center justify-center gap-1.5">
            <Lock size={10} aria-hidden="true" />
            Mercado pausado — partido en curso
          </div>
        )}
      </div>
    </Link>
  )
}
