'use client'

import { useState, useEffect } from 'react'
import { crearClienteSupabase } from '@/lib/supabase/client'
import type { LeagueAsset, Team, LeaderboardEntry, MarketEvent } from '@/types'

interface PantallaPublicaClienteProps {
  tenant: { id: string; nombre: string; modo_pantalla: string }
  assetsIniciales: Array<LeagueAsset & { team: Team }>
  leaderboardInicial: LeaderboardEntry[]
}

export function PantallaPublicaCliente({
  tenant,
  assetsIniciales,
  leaderboardInicial,
}: PantallaPublicaClienteProps) {
  const [assets, setAssets] = useState(assetsIniciales)
  const [leaderboard, setLeaderboard] = useState(leaderboardInicial)
  const [eventoReciente, setEventoReciente] = useState<MarketEvent | null>(null)
  const [flashActivo, setFlashActivo] = useState(false)
  const [horaActual, setHoraActual] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = crearClienteSupabase()

    // Suscripción a cambios de precio
    const canalPrecios = supabase
      .channel(`live-precios-${tenant.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'league_assets',
        filter: `tenant_id=eq.${tenant.id}`,
      }, (payload) => {
        setAssets(prev => prev.map(a =>
          a.id === payload.new.id
            ? { ...a, precio_actual: payload.new.precio_actual, ultimo_update: payload.new.ultimo_update }
            : a
        ))
      })
      .subscribe()

    // Suscripción a eventos en vivo
    const canalEventos = supabase
      .channel(`live-eventos-${tenant.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'market_events',
        filter: `tenant_id=eq.${tenant.id}`,
      }, (payload) => {
        setEventoReciente(payload.new as MarketEvent)
        setFlashActivo(true)
        setTimeout(() => setFlashActivo(false), 3000)
      })
      .subscribe()

    // Reloj en vivo
    setHoraActual(new Date())
    const intervaloReloj = setInterval(() => setHoraActual(new Date()), 1000)

    return () => {
      supabase.removeChannel(canalPrecios)
      supabase.removeChannel(canalEventos)
      clearInterval(intervaloReloj)
    }
  }, [tenant.id])

  const iconoEvento = (tipo: string) => {
    const iconos: Record<string, string> = {
      gol: '⚽', doblete: '⚽⚽', hat_trick: '🎩', tarjeta_roja: '🟥',
      tarjeta_roja_figura: '🟥⭐', lesion_titular: '🏥', atajada_penalti: '🧤',
      goleada: '💥', clasificacion: '🏆', eliminacion: '❌',
    }
    return iconos[tipo] ?? '📢'
  }

  // Ticker items para la barra superior
  const tickerItems = assets.map(a => {
    const cambio = ((a.precio_actual - a.precio_apertura_dia) / a.precio_apertura_dia) * 100
    return { ...a, cambio }
  })

  return (
    <div className={`min-h-screen bg-zinc-950 flex flex-col select-none transition-all duration-300 ${
      flashActivo ? 'ring-inset ring-4 ring-emerald-500' : ''
    }`}>
      {/* Flash de evento */}
      {eventoReciente && flashActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-zinc-900 border-2 border-emerald-500 rounded-2xl px-12 py-8 shadow-2xl shadow-emerald-500/30 text-center animate-bounce">
            <p className="text-6xl mb-2">{iconoEvento(eventoReciente.tipo)}</p>
            <p className="text-2xl font-black text-zinc-100">{eventoReciente.descripcion ?? eventoReciente.tipo.toUpperCase()}</p>
            {eventoReciente.jugador_nombre && (
              <p className="text-zinc-400 mt-1">{eventoReciente.jugador_nombre}</p>
            )}
            <p className={`text-3xl font-mono font-bold mt-2 ${
              eventoReciente.impacto_precio > 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {eventoReciente.impacto_precio > 0 ? '+' : ''}{(eventoReciente.impacto_precio * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black">
            <span className="text-emerald-400">Gol</span>
            <span className="text-zinc-100">Street</span>
          </span>
          <span className="text-zinc-600 text-lg">{tenant.nombre}</span>
        </div>
        <div className="text-right font-mono">
          <p className="text-4xl font-bold text-zinc-100 tabular-nums">
            {horaActual?.toLocaleTimeString('es-CO') ?? '--:--:--'}
          </p>
          <p className="text-sm text-zinc-500">
            {horaActual?.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) ?? ''}
          </p>
        </div>
      </div>

      {/* Ticker scrolling */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-3 overflow-hidden">
        <div className="flex gap-10 animate-ticker-slow whitespace-nowrap">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-lg font-mono">
              <img src={item.team.bandera_url} alt={item.team.nombre} className="w-6 h-4 object-cover rounded" />
              <span className="font-bold text-zinc-200">{item.team.codigo_pais}</span>
              <span className="text-zinc-300">${item.precio_actual.toLocaleString('es-CO')}</span>
              <span className={item.cambio > 0 ? 'text-emerald-400' : item.cambio < 0 ? 'text-red-400' : 'text-zinc-500'}>
                {item.cambio > 0 ? '▲' : item.cambio < 0 ? '▼' : '▬'} {Math.abs(item.cambio).toFixed(1)}%
              </span>
              <span className="text-zinc-700 mx-2">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Zona central — tabla de precios */}
      <div className="flex-1 grid grid-cols-2 gap-6 p-8">
        {/* Tabla de equipos */}
        <div className="space-y-2">
          <h2 className="text-zinc-500 text-sm uppercase tracking-widest mb-4">Equipos</h2>
          {assets.map((asset) => {
            const cambio = ((asset.precio_actual - asset.precio_apertura_dia) / asset.precio_apertura_dia) * 100
            return (
              <div
                key={asset.id}
                className="flex items-center justify-between bg-zinc-900 rounded-xl px-5 py-3 border border-zinc-800"
              >
                <div className="flex items-center gap-4">
                  <img src={asset.team.bandera_url} alt={asset.team.nombre} className="w-12 h-8 object-cover rounded shadow" />
                  <div>
                    <p className="font-bold text-zinc-100 text-lg">{asset.team.nombre}</p>
                    <p className="text-zinc-600 text-sm">{asset.team.codigo_pais}</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xl font-bold text-zinc-100">
                    ${asset.precio_actual.toLocaleString('es-CO')}
                  </p>
                  <p className={`text-sm font-semibold ${cambio > 0 ? 'text-emerald-400' : cambio < 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                    {cambio > 0 ? '▲' : cambio < 0 ? '▼' : '▬'} {Math.abs(cambio).toFixed(2)}%
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="text-zinc-500 text-sm uppercase tracking-widest mb-4">Ranking</h2>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 rounded-xl px-5 py-3 border ${
                  entry.posicion === 1 ? 'bg-yellow-900/20 border-yellow-700/50' :
                  entry.posicion === 2 ? 'bg-zinc-700/20 border-zinc-600/50' :
                  entry.posicion === 3 ? 'bg-orange-900/20 border-orange-700/50' :
                  'bg-zinc-900 border-zinc-800'
                }`}
              >
                <span className={`text-2xl font-black w-10 text-center ${
                  entry.posicion === 1 ? 'text-yellow-400' :
                  entry.posicion === 2 ? 'text-zinc-300' :
                  entry.posicion === 3 ? 'text-orange-400' :
                  'text-zinc-600'
                }`}>
                  {entry.posicion <= 3 ? ['🥇', '🥈', '🥉'][entry.posicion - 1] : `#${entry.posicion}`}
                </span>
                <div className="flex-1">
                  {/* Nombre parcial por privacidad */}
                  <p className="font-bold text-zinc-100 text-lg">
                    {entry.nombre?.split(' ')[0] ?? 'Jugador'} {entry.nombre?.split(' ').pop()?.[0] ?? ''}.
                  </p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xl font-bold text-zinc-100">
                    ${entry.valor_total.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                  </p>
                  <p className={`text-sm ${entry.ganancia_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {entry.ganancia_pct >= 0 ? '+' : ''}{entry.ganancia_pct.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-slow {
          animation: ticker-slow 60s linear infinite;
        }
      `}</style>
    </div>
  )
}
