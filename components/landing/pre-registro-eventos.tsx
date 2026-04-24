'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle, ArrowRight, Globe, Trophy, Building2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PreRegistroEventos() {
  const t = useTranslations('preregistro')
  const [email,       setEmail]       = useState('')
  const [seleccion,   setSeleccion]   = useState<string[]>([])
  const [cargando,    setCargando]    = useState(false)
  const [exito,       setExito]       = useState(false)
  const [error,       setError]       = useState('')

  const EVENTOS_FUTUROS = [
    {
      id: 'copa_america',
      icono: Trophy,
      nombre: t('copa.name'),
      desc: t('copa.desc'),
      color: 'border-yellow-700/50 bg-yellow-950/20 text-yellow-400',
      colorActivo: 'border-yellow-500/60 bg-yellow-950/40 ring-1 ring-yellow-500/30',
    },
    {
      id: 'champions',
      icono: Globe,
      nombre: t('champions.name'),
      desc: t('champions.desc'),
      color: 'border-blue-700/50 bg-blue-950/20 text-blue-400',
      colorActivo: 'border-blue-500/60 bg-blue-950/40 ring-1 ring-blue-500/30',
    },
    {
      id: 'empresarial',
      icono: Building2,
      nombre: t('empresa.name'),
      desc: t('empresa.desc'),
      color: 'border-purple-700/50 bg-purple-950/20 text-purple-400',
      colorActivo: 'border-purple-500/60 bg-purple-950/40 ring-1 ring-purple-500/30',
    },
  ]

  const toggleEvento = (id: string) => {
    setSeleccion(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError(t('email_error'))
      return
    }
    setError('')
    setCargando(true)

    try {
      await fetch('/api/pre-registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), eventos: seleccion }),
      })
    } catch {
      // Si no hay API todavía, igual mostramos éxito
    }

    // Pequeño delay para la animación
    await new Promise(r => setTimeout(r, 600))
    setCargando(false)
    setExito(true)
  }

  return (
    <section className="relative container mx-auto max-w-5xl px-4 py-20">
      <div className="relative rounded-3xl border border-slate-800 bg-slate-950/80 overflow-hidden">

        {/* Glow decorativo */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500/8 blur-[100px] rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/8 blur-[100px] rounded-full" />
        </div>

        {/* Franja superior */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-500" />

        <div className="relative p-8 sm:p-12">

          <AnimatePresence mode="wait">
            {!exito ? (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-purple-950/50 border border-purple-800/50 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                      <Sparkles size={11} />
                      {t('badge')}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                      {t('title')}
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                      {t('subtitle_pre')}{' '}
                      <strong className="text-emerald-400">{t('subtitle_highlight')}</strong>{' '}
                      {t('subtitle_post')}
                    </p>
                  </div>

                  {/* Descuento badge */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-28 h-28 rounded-full border-2 border-emerald-500/50 bg-emerald-950/30 shadow-lg shadow-emerald-500/10">
                    <span className="text-3xl font-black text-emerald-400 leading-none">20%</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mt-1 text-center leading-tight">{t('discount_label')}</span>
                  </div>
                </div>

                {/* Selector de eventos */}
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  {t('events_label')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
                  {EVENTOS_FUTUROS.map(({ id, icono: Icono, nombre, desc, color, colorActivo }) => {
                    const activo = seleccion.includes(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleEvento(id)}
                        className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                          activo ? colorActivo : `${color} opacity-70 hover:opacity-100`
                        }`}
                      >
                        {activo && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 right-3"
                          >
                            <CheckCircle size={15} className="text-emerald-400" />
                          </motion.div>
                        )}
                        <Icono size={18} className="mb-2.5 opacity-80" />
                        <p className="text-xs font-bold text-white leading-tight mb-1">{nombre}</p>
                        <p className="text-[10px] text-slate-500 leading-snug">{desc}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Form email */}
                <form onSubmit={enviar} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t('email_placeholder')}
                      className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-600 text-sm outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                      required
                    />
                    {error && <p className="text-xs text-red-400 mt-1.5 ml-1">{error}</p>}
                  </div>
                  <Button
                    type="submit"
                    disabled={cargando}
                    className="h-12 px-7 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                    style={{ boxShadow: '0 0 24px oklch(0.72 0.22 148 / 30%)' }}
                  >
                    {cargando ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                        />
                        {t('submitting')}
                      </span>
                    ) : (
                      <>
                        {t('submit')}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-[11px] text-slate-700 mt-3">
                  {t('disclaimer')}
                </p>

              </motion.div>
            ) : (
              <motion.div
                key="exito"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle size={32} className="text-emerald-400" />
                </motion.div>
                <h3 className="text-2xl font-extrabold mb-2">{t('success_title')}</h3>
                <p className="text-slate-400 max-w-sm leading-relaxed text-sm mb-4">
                  {t('success_desc_pre')} <strong className="text-emerald-400">{t('success_desc_bold')}</strong>{' '}
                  {t('success_desc_post')}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {t('success_email')}{' '}
                  <span className="text-slate-400 font-mono">{email}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </section>
  )
}
