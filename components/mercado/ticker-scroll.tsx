'use client'

import { useEffect, useRef, useState } from 'react'
import { crearClienteSupabase } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, Minus, Radio } from 'lucide-react'
import type { TickerItem } from '@/types'

interface TickerScrollProps {
  tenantId: string
  inicial?: TickerItem[]
}

export function TickerScroll({ tenantId, inicial = [] }: TickerScrollProps) {
  const [items, setItems] = useState<TickerItem[]>(inicial)
  const [flashMap, setFlashMap] = useState<Record<string, 'up' | 'down'>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = crearClienteSupabase()

    const canal = supabase
      .channel(`ticker-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'league_assets',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          setItems(prev =>
            prev.map(item => {
              if (item.codigo_pais === payload.new.team_id) {
                const cambio = ((payload.new.precio_actual - item.precio_actual) / item.precio_actual) * 100
                const dir: 'up' | 'down' = payload.new.precio_actual > item.precio_actual ? 'up' : 'down'
                setFlashMap(f => ({ ...f, [item.codigo_pais]: dir }))
                setTimeout(() => setFlashMap(f => { const n = { ...f }; delete n[item.codigo_pais]; return n }), 800)
                return { ...item, precio_actual: payload.new.precio_actual, cambio_pct: cambio }
              }
              return item
            })
          )
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [tenantId])

  const itemsDuplicados = [...items, ...items]

  return (
    <div className="w-full bg-card/60 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="flex items-center">
        {/* Live badge */}
        <div className="shrink-0 flex items-center gap-1.5 px-4 border-r border-border py-2.5 bg-muted/20">
          <Radio size={11} className="text-emerald-400 animate-pulse" aria-hidden="true" />
          <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">Live</span>
        </div>

        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1 py-0">
          <div
            ref={scrollRef}
            className="flex gap-0 animate-ticker whitespace-nowrap"
          >
            {itemsDuplicados.map((item, i) => {
              const positivo = item.cambio_pct > 0
              const neutro   = item.cambio_pct === 0
              const flash    = flashMap[item.codigo_pais]

              return (
                <span
                  key={`${item.codigo_pais}-${i}`}
                  className={`inline-flex items-center gap-2 text-xs font-mono px-4 py-2.5 border-r border-border/40 last:border-r-0 transition-colors duration-300
                    ${flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''}`}
                >
                  <img
                    src={item.bandera_url}
                    alt={item.nombre}
                    className="w-5 h-3.5 object-cover rounded-[2px] opacity-90"
                  />
                  <span className="font-semibold text-foreground/90 text-[11px] tracking-wider">
                    {item.codigo_pais}
                  </span>
                  <span className="text-muted-foreground">
                    ${item.precio_actual.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                  </span>
                  <span className={`inline-flex items-center gap-0.5 font-bold text-[11px] ${
                    positivo ? 'text-emerald-400' : neutro ? 'text-muted-foreground' : 'text-red-400'
                  }`}>
                    {positivo
                      ? <TrendingUp size={10} aria-hidden="true" />
                      : neutro
                      ? <Minus size={10} aria-hidden="true" />
                      : <TrendingDown size={10} aria-hidden="true" />}
                    {positivo ? '+' : ''}{Math.abs(item.cambio_pct).toFixed(1)}%
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
