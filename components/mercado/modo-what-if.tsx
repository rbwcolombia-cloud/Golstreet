'use client'

import { useEffect, useState } from 'react'
import { crearClienteSupabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EliminacionInfo {
  teamId: string
  teamNombre: string
  banderaUrl: string
  accionesCompradas: number
  precioPagoPromedio: number
  precioVentaAntes: number
  liquidacionRecibida: number
  alternativas: Array<{
    nombre: string
    bandera: string
    cambio: number
    gananciaHipotetica: number
  }>
}

interface ModoWhatIfProps {
  tenantId: string
  userId: string
}

export function ModoWhatIf({ tenantId, userId }: ModoWhatIfProps) {
  const [info, setInfo] = useState<EliminacionInfo | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const supabase = crearClienteSupabase()

    const canal = supabase
      .channel(`whatif-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'trades',
        filter: `tipo=eq.liquidacion`,
      }, async (payload) => {
        const trade = payload.new as Record<string, unknown>

        // Verificar que sea del tenant y del usuario
        const { data: portfolio } = await supabase
          .from('portfolios')
          .select('user_id')
          .eq('id', trade.portfolio_id)
          .single()

        if (portfolio?.user_id !== userId) return

        // Buscar información del equipo eliminado
        const { data: team } = await supabase
          .from('teams')
          .select('nombre, bandera_url')
          .eq('id', trade.team_id)
          .single()

        // Calcular alternativas con los otros equipos activos
        const { data: activos } = await supabase
          .from('league_assets')
          .select('precio_actual, precio_apertura_dia, teams(nombre, bandera_url)')
          .eq('tenant_id', tenantId)
          .neq('team_id', trade.team_id)
          .eq('mercado_pausado', false)
          .order('precio_actual', { ascending: false })
          .limit(3)

        const inversionOriginal = (trade.acciones as number) * (trade.precio_operacion as number / 0.2) // precio pagado ≈ liquidación / 20%
        const liquidacion = (trade.acciones as number) * (trade.precio_operacion as number)

        const alternativas = (activos ?? []).map((a) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const t = (a.teams as any) as Record<string, string>
          const cambio = a.precio_apertura_dia > 0
            ? ((a.precio_actual - a.precio_apertura_dia) / a.precio_apertura_dia) * 100
            : 0
          return {
            nombre: t.nombre ?? '',
            bandera: t.bandera_url ?? '',
            cambio: Math.round(cambio * 10) / 10,
            gananciaHipotetica: Math.round(inversionOriginal * (cambio / 100)),
          }
        })

        setInfo({
          teamId: trade.team_id as string,
          teamNombre: team?.nombre ?? 'Equipo',
          banderaUrl: team?.bandera_url ?? '',
          accionesCompradas: trade.acciones as number,
          precioPagoPromedio: inversionOriginal / (trade.acciones as number),
          precioVentaAntes: (trade.precio_operacion as number) / 0.2,
          liquidacionRecibida: liquidacion,
          alternativas,
        })
        setVisible(true)
      })
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [tenantId, userId])

  if (!visible || !info) return null

  const perdidaTotal = info.liquidacionRecibida - info.accionesCompradas * info.precioPagoPromedio

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-900/30 border-b border-red-800/50 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={info.banderaUrl} alt="" className="w-10 h-7 object-cover rounded" />
            <div>
              <p className="font-black text-zinc-100">{info.teamNombre} eliminado</p>
              <p className="text-xs text-red-400">Liquidación automática procesada</p>
            </div>
          </div>
          <button onClick={() => setVisible(false)} className="text-zinc-500 hover:text-zinc-300 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Resultado real */}
        <div className="px-5 py-4 border-b border-zinc-800">
          <p className="text-sm text-zinc-500 mb-2">Lo que pasó</p>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Invertiste</span>
            <span className="text-zinc-300 font-mono">
              ${(info.accionesCompradas * info.precioPagoPromedio).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-zinc-400">Recibiste (liquidación)</span>
            <span className="text-zinc-300 font-mono">
              ${info.liquidacionRecibida.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-zinc-800">
            <span className="text-zinc-300">Resultado</span>
            <span className={`font-mono ${perdidaTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {perdidaTotal >= 0 ? '+' : ''}${Math.abs(perdidaTotal).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* What If */}
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-zinc-300 mb-3">¿Qué hubiera pasado si…?</p>
          <div className="space-y-2">
            {/* Venta antes del partido */}
            <div className="bg-zinc-800 rounded-lg p-3 flex justify-between items-center">
              <p className="text-sm text-zinc-400">Vendías antes del partido</p>
              <span className="text-emerald-400 font-mono text-sm font-bold">
                +${Math.abs((info.accionesCompradas * info.precioVentaAntes * 0.98) - (info.accionesCompradas * info.precioPagoPromedio)).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </span>
            </div>
            {/* Alternativas */}
            {info.alternativas.map((alt, i) => (
              <div key={i} className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={alt.bandera} alt="" className="w-6 h-4 object-cover rounded" />
                  <p className="text-sm text-zinc-400">Comprabas {alt.nombre}</p>
                </div>
                <span className={`font-mono text-sm font-bold ${alt.gananciaHipotetica >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {alt.gananciaHipotetica >= 0 ? '+' : ''}${Math.abs(alt.gananciaHipotetica).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <Button
            onClick={() => { setVisible(false); window.location.href = '/mercado' }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
          >
            Reinvertir en otro equipo →
          </Button>
        </div>
      </div>
    </div>
  )
}
