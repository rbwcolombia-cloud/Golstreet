'use client'

import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
} from 'recharts'
import type { CandleData } from '@/types'

interface GraficaVelasProps {
  datos: CandleData[]
}

// Componente de vela japonesa individual
const VelaJaponesa = (props: {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: CandleData
}) => {
  const { x = 0, y = 0, width = 0, payload } = props
  if (!payload) return null

  const { open, close, high, low } = payload
  const esBajista = close < open
  const color = esBajista ? '#ef4444' : '#22c55e'
  const centerX = x + width / 2

  // Calcular escala — los valores vienen del dominio del eje Y
  // El gráfico maneja las coordenadas
  const minVal = Math.min(open, close)
  const maxVal = Math.max(open, close)

  return (
    <g>
      {/* Mecha superior */}
      <line
        x1={centerX} y1={y}
        x2={centerX} y2={y + (props.height ?? 0) * ((high - maxVal) / (high - low))}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Cuerpo de la vela */}
      <rect
        x={x + 2}
        y={y + (props.height ?? 0) * ((high - maxVal) / (high - low))}
        width={width - 4}
        height={Math.max(1, (props.height ?? 0) * ((maxVal - minVal) / (high - low)))}
        fill={esBajista ? color : 'transparent'}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Mecha inferior */}
      <line
        x1={centerX}
        y1={y + (props.height ?? 0) * ((high - minVal) / (high - low))}
        x2={centerX}
        y2={y + (props.height ?? 0)}
        stroke={color}
        strokeWidth={1.5}
      />
    </g>
  )
}

const TooltipPersonalizado = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CandleData }> }) => {
  if (!active || !payload?.[0]) return null

  const d = payload[0].payload
  const esBajista = d.close < d.open

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs font-mono shadow-xl">
      <p className="text-zinc-400 mb-2">{new Date(d.timestamp).toLocaleTimeString('es-CO')}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-zinc-500">Apertura</span>
        <span className="text-zinc-200">${d.open.toLocaleString('es-CO')}</span>
        <span className="text-zinc-500">Máximo</span>
        <span className="text-emerald-400">${d.high.toLocaleString('es-CO')}</span>
        <span className="text-zinc-500">Mínimo</span>
        <span className="text-red-400">${d.low.toLocaleString('es-CO')}</span>
        <span className="text-zinc-500">Cierre</span>
        <span className={esBajista ? 'text-red-400' : 'text-emerald-400'}>
          ${d.close.toLocaleString('es-CO')}
        </span>
        <span className="text-zinc-500">Volumen</span>
        <span className="text-zinc-300">{d.volume.toLocaleString('es-CO')}</span>
      </div>
    </div>
  )
}

export function GraficaVelas({ datos }: GraficaVelasProps) {
  if (datos.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-600">
        <p>Sin datos de precio disponibles todavía.</p>
      </div>
    )
  }

  const minPrecio = Math.min(...datos.map(d => d.low)) * 0.98
  const maxPrecio = Math.max(...datos.map(d => d.high)) * 1.02

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={datos} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(v) => new Date(v).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          tick={{ fill: '#71717a', fontSize: 11 }}
          axisLine={{ stroke: '#3f3f46' }}
          tickLine={false}
        />
        <YAxis
          domain={[minPrecio, maxPrecio]}
          tickFormatter={(v) => `$${v.toLocaleString('es-CO')}`}
          tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#3f3f46' }}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<TooltipPersonalizado />} />
        <Bar
          dataKey="high"
          shape={<VelaJaponesa />}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
