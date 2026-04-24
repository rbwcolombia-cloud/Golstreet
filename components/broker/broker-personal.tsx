'use client'

import { useEffect, useState } from 'react'
import { crearClienteSupabase } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AlertLog } from '@/types'

interface BrokerPersonalProps {
  userId: string
  tenantId: string
}

interface OpcionAlerta {
  texto: string
  accion: string
  estilo: 'primario' | 'secundario' | 'peligro'
}

export function BrokerPersonal({ userId, tenantId }: BrokerPersonalProps) {
  const [alertaActual, setAlertaActual] = useState<AlertLog | null>(null)
  const [cola, setCola] = useState<AlertLog[]>([])

  useEffect(() => {
    const supabase = crearClienteSupabase()

    // Cargar alertas no leídas al inicio
    const cargarAlertas = async () => {
      const { data } = await supabase
        .from('alerts_log')
        .select('*, team:teams(nombre, bandera_url)')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('leida', false)
        .order('timestamp', { ascending: true })
        .limit(5)

      if (data && data.length > 0) {
        setCola(data as AlertLog[])
      }
    }
    cargarAlertas()

    // Suscripción Realtime a nuevas alertas
    const canal = supabase
      .channel(`broker-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts_log',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.tenant_id === tenantId) {
            setCola(prev => [...prev, payload.new as AlertLog])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(canal) }
  }, [userId, tenantId])

  // Mostrar la primera alerta de la cola
  useEffect(() => {
    if (!alertaActual && cola.length > 0) {
      const [primera, ...resto] = cola
      setAlertaActual(primera)
      setCola(resto)
    }
  }, [cola, alertaActual])

  const cerrarAlerta = async (alertaId: string) => {
    const supabase = crearClienteSupabase()
    await supabase.from('alerts_log').update({ leida: true }).eq('id', alertaId)
    setAlertaActual(null)
  }

  const tomarAccion = async (alerta: AlertLog, accion: string) => {
    const supabase = crearClienteSupabase()
    await supabase
      .from('alerts_log')
      .update({ leida: true, accion_tomada: accion })
      .eq('id', alerta.id)

    // Navegar según la acción
    if (accion === 'ver_mercado') window.location.href = '/mercado'
    if (accion === 'ver_equipo' && alerta.team_id) window.location.href = `/equipo/${alerta.team_id}`

    setAlertaActual(null)
  }

  const iconoBroker: Record<string, string> = {
    partido_perdiendo: '⚠️',
    tarjeta_roja_figura: '🟥',
    noticia_negativa: '📰',
    coins_inactivos: '💤',
    equipo_ganando: '🚀',
    eliminacion: '❌',
    dividendo: '🎉',
  }

  const colorBorde: Record<string, string> = {
    partido_perdiendo: 'border-orange-600',
    tarjeta_roja_figura: 'border-red-600',
    noticia_negativa: 'border-yellow-600',
    coins_inactivos: 'border-zinc-600',
    equipo_ganando: 'border-emerald-600',
    eliminacion: 'border-red-700',
    dividendo: 'border-yellow-500',
  }

  const estiloBoton = (estilo: string) => {
    if (estilo === 'primario') return 'bg-emerald-600 hover:bg-emerald-500 text-white'
    if (estilo === 'peligro') return 'bg-red-600 hover:bg-red-500 text-white'
    return 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
  }

  if (!alertaActual) return null

  const opciones = (alertaActual.opciones as OpcionAlerta[] | undefined) ?? []

  return (
    <AnimatePresence>
      <motion.div
        key={alertaActual.id}
        initial={{ opacity: 0, y: 80, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 80, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-4`}
      >
        <div className={`bg-zinc-900 border-2 ${colorBorde[alertaActual.tipo] ?? 'border-zinc-700'} rounded-2xl shadow-2xl overflow-hidden`}>
          {/* Header del broker */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">{iconoBroker[alertaActual.tipo] ?? '📢'}</span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Tu Broker</span>
            </div>
            <button
              onClick={() => cerrarAlerta(alertaActual.id)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors p-1"
            >
              <X size={14} />
            </button>
          </div>

          {/* Equipo afectado */}
          {alertaActual.team && (
            <div className="flex items-center gap-2 px-4 pt-3">
              <img
                src={(alertaActual.team as unknown as Record<string, string>).bandera_url}
                alt=""
                className="w-8 h-5.5 object-cover rounded"
              />
              <span className="text-sm font-semibold text-zinc-300">
                {(alertaActual.team as unknown as Record<string, string>).nombre}
              </span>
            </div>
          )}

          {/* Mensaje */}
          <div className="px-4 py-3">
            <p className="text-zinc-200 text-sm leading-relaxed">{alertaActual.mensaje}</p>
          </div>

          {/* Opciones de acción */}
          {opciones.length > 0 && (
            <div className="flex gap-2 px-4 pb-4">
              {opciones.map((op, i) => (
                <Button
                  key={i}
                  size="sm"
                  className={`flex-1 text-xs font-semibold ${estiloBoton(op.estilo)}`}
                  onClick={() => tomarAccion(alertaActual, op.accion)}
                >
                  {op.texto}
                </Button>
              ))}
            </div>
          )}

          {opciones.length === 0 && (
            <div className="px-4 pb-4">
              <Button
                size="sm"
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs"
                onClick={() => cerrarAlerta(alertaActual.id)}
              >
                Entendido
              </Button>
            </div>
          )}

          {/* Indicador de más alertas */}
          {cola.length > 0 && (
            <div className="px-4 pb-2 text-center">
              <span className="text-xs text-zinc-600">{cola.length} alerta{cola.length > 1 ? 's' : ''} más</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
