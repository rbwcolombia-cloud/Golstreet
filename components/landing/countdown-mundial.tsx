'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Zap } from 'lucide-react'

// Primer partido FIFA World Cup 2026: 11 de junio de 2026, 5:00 PM ET
const INICIO_MUNDIAL = new Date('2026-06-11T21:00:00Z')

interface Tiempo {
  dias: number
  horas: number
  minutos: number
  segundos: number
}

function calcularTiempo(): Tiempo {
  const ahora  = Date.now()
  const diff   = Math.max(0, INICIO_MUNDIAL.getTime() - ahora)
  const dias      = Math.floor(diff / (1000 * 60 * 60 * 24))
  const horas     = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutos   = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const segundos  = Math.floor((diff % (1000 * 60)) / 1000)
  return { dias, horas, minutos, segundos }
}

function Bloque({ valor, label }: { valor: number; label: string }) {
  const str = String(valor).padStart(2, '0')

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Dígitos con flip visual */}
      <div className="relative flex gap-1">
        {str.split('').map((d, i) => (
          <motion.div
            key={`${i}-${d}`}
            initial={{ rotateX: -40, opacity: 0.3 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="w-11 h-14 sm:w-14 sm:h-16 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-mono font-black text-3xl sm:text-4xl text-white shadow-inner"
            style={{ textShadow: '0 0 20px oklch(0.72 0.22 148 / 40%)' }}
          >
            {d}
          </motion.div>
        ))}
      </div>
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  )
}

export function CountdownMundial() {
  const t = useTranslations('countdown')
  const [tiempo, setTiempo] = useState<Tiempo>(calcularTiempo)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
    const id = setInterval(() => setTiempo(calcularTiempo()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!montado) return null

  const terminado = tiempo.dias === 0 && tiempo.horas === 0 && tiempo.minutos === 0 && tiempo.segundos === 0

  return (
    <section className="relative border-y border-border overflow-hidden py-14 px-4">
      {/* Glow de fondo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-emerald-500/6 blur-[90px] rounded-full" />
      </div>

      <div className="relative container mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-bold px-3.5 py-1.5 rounded-full mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Zap size={11} />
          {t('badge')}
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
          {t('title')}
        </h2>
        <p className="text-slate-500 text-sm mb-8">
          {t('subtitle')}
        </p>

        {terminado ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black text-emerald-400"
            style={{ textShadow: '0 0 40px oklch(0.72 0.22 148 / 60%)' }}
          >
            {t('open')}
          </motion.div>
        ) : (
          <div className="flex items-end justify-center gap-3 sm:gap-4">
            <Bloque valor={tiempo.dias}     label={t('days')}    />
            <span className="text-3xl font-black text-slate-600 mb-5 select-none">:</span>
            <Bloque valor={tiempo.horas}    label={t('hours')}   />
            <span className="text-3xl font-black text-slate-600 mb-5 select-none">:</span>
            <Bloque valor={tiempo.minutos}  label={t('minutes')} />
            <span className="text-3xl font-black text-slate-600 mb-5 select-none">:</span>
            <Bloque valor={tiempo.segundos} label={t('seconds')} />
          </div>
        )}

        <p className="mt-7 text-xs text-slate-600">
          Todos los <span className="text-slate-400 font-semibold">48 equipos clasificados</span> cotizan desde el arranque · Precios actualizados partido a partido
        </p>
      </div>
    </section>
  )
}
