'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { X, ArrowRight, TrendingUp, ChevronRight, ChevronLeft, Ticket, Gamepad2, BarChart3, ScrollText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const TOTAL_PASOS = 5

// ── Contador animado ──────────────────────────────────────────────────────────
function ContadorAnimado({ desde, hasta, prefix = '', duracion = 1200 }: {
  desde: number; hasta: number; prefix?: string; duracion?: number
}) {
  const [valor, setValor] = useState(desde)

  useEffect(() => {
    const inicio = performance.now()
    const rango = hasta - desde
    const tick = (now: number) => {
      const t = Math.min((now - inicio) / duracion, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValor(Math.round(desde + rango * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [desde, hasta, duracion])

  return <>{prefix}{valor.toLocaleString('es-CO')}</>
}

// ── PASO 0 — Hook ─────────────────────────────────────────────────────────────
function StepHook() {
  const t = useTranslations('infografia')
  const banderas = [
    { code: 'ar', delay: 0 },
    { code: 'br', delay: 0.1 },
    { code: 'es', delay: 0.2 },
    { code: 'fr', delay: 0.3 },
    { code: 'co', delay: 0.4 },
  ]

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[400px] px-8 py-12 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full" />
      </div>

      {/* Banderas flotantes */}
      <div className="relative flex gap-3 mb-8">
        {banderas.map(({ code, delay }) => (
          <motion.div
            key={code}
            initial={{ opacity: 0, y: 20, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.5, type: 'spring', damping: 14 }}
            className="w-14 h-9 rounded-lg overflow-hidden shadow-xl ring-1 ring-white/10"
          >
            <img src={`https://flagcdn.com/${code}.svg`} alt={code} className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3"
      >
        {t('hook.badge')}
      </motion.p>

      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-3xl sm:text-4xl font-extrabold leading-tight mb-5 tracking-tight"
      >
        {t('hook.title_pre')}<br />
        {t('hook.title_post')} <span className="text-emerald-400">{t('hook.title_highlight')}</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="text-base text-slate-400 max-w-sm leading-relaxed"
      >
        {t('hook.subtitle')}{' '}
        <strong className="text-white">{t('hook.subtitle_bold')}</strong>{' '}
        {t('hook.subtitle_end')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="mt-7 flex items-center gap-1.5 text-xs text-slate-600"
      >
        <span>{t('hook.continue')}</span>
        <ChevronRight size={13} />
      </motion.div>
    </div>
  )
}

// ── PASO 1 — Evolución ────────────────────────────────────────────────────────

function StepEvolucion() {
  const t = useTranslations('infografia')

  const ERA = [
    {
      año: t('evolution.quiniela_year'),
      nombre: t('evolution.quiniela_name'),
      desc: t('evolution.quiniela_desc'),
      Icon: ScrollText,
      activo: false,
    },
    {
      año: t('evolution.prode_year'),
      nombre: t('evolution.prode_name'),
      desc: t('evolution.prode_desc'),
      Icon: Ticket,
      activo: false,
    },
    {
      año: t('evolution.fantasy_year'),
      nombre: t('evolution.fantasy_name'),
      desc: t('evolution.fantasy_desc'),
      Icon: Gamepad2,
      activo: false,
    },
    {
      año: t('evolution.golstreet_year'),
      nombre: t('evolution.golstreet_name'),
      desc: t('evolution.golstreet_desc'),
      Icon: BarChart3,
      activo: true,
    },
  ]

  return (
    <div className="px-6 py-9">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-7"
      >
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">{t('evolution.label')}</p>
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          {t('evolution.title_pre')}<br />{t('evolution.title_post')}
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ERA.map(({ año, nombre, desc, Icon, activo }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.13 }}
            className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
              activo
                ? 'bg-emerald-950/40 border-emerald-600/60 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/50 border-slate-800'
            }`}
          >
            {activo && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-emerald-500 text-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                {t('evolution.badge_new')}
              </span>
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${activo ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
              <Icon size={18} className={activo ? 'text-emerald-400' : 'text-slate-500'} />
            </div>
            <span className="text-[10px] font-mono text-slate-600 mb-1">{año}</span>
            <p className={`text-xs font-bold mb-1 leading-tight ${activo ? 'text-emerald-300' : 'text-slate-300'}`}>{nombre}</p>
            <p className="text-[10px] text-slate-500 leading-snug">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── PASO 2 — Concepto ─────────────────────────────────────────────────────────
function StepConcepto() {
  const t = useTranslations('infografia')

  return (
    <div className="px-6 py-9">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-7"
      >
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">{t('concept.label')}</p>
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          {t('concept.title_pre')}{' '}
          <span className="text-emerald-400">{t('concept.title_highlight')}</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('concept.before_title')}</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            {t('concept.before_desc')}
          </p>
          <p className="mt-3 text-xs text-slate-600 italic">{t('concept.before_tag')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.33 }}
          className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 ring-1 ring-emerald-500/20"
        >
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">{t('concept.now_title')}</p>
          <p className="text-sm text-slate-200 leading-relaxed">
            {t('concept.now_desc_pre')} <strong className="text-emerald-300">{t('concept.now_desc_bold')}</strong>{' '}
            {t('concept.now_desc_post')}
          </p>
          <p className="mt-3 text-xs text-emerald-500 italic">{t('concept.now_tag')}</p>
        </motion.div>
      </div>

      {/* Mini stock card */}
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl"
      >
        <div className="flex items-center gap-3">
          <img src="https://flagcdn.com/ar.svg" alt="Argentina" className="w-11 h-7 object-cover rounded-md shadow-md" />
          <div>
            <p className="font-bold text-white text-sm">Argentina</p>
            <p className="text-[10px] text-slate-500 font-mono tracking-wide">ARG · GS26</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-white text-xl">$1,400</p>
          <p className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-0.5 justify-end">
            <TrendingUp size={10} />
            +8.5% {t('concept.card_price_label')}
          </p>
        </div>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.9, type: 'spring', damping: 12 }}
          className="ml-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3.5 py-2 rounded-xl cursor-default select-none"
        >
          {t('concept.card_buy')}
        </motion.div>
      </motion.div>
    </div>
  )
}

// ── PASO 3 — Ejemplo vivo ─────────────────────────────────────────────────────
function StepEjemplo() {
  const t = useTranslations('infografia')
  const [fase, setFase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setFase(1), 700)
    const t2 = setTimeout(() => setFase(2), 2000)
    const t3 = setTimeout(() => setFase(3), 3500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className="px-6 py-9">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-7"
      >
        <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">{t('example.label')}</p>
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          {t('example.title')}
        </h2>
      </motion.div>

      <div className="space-y-3">
        {/* Compra */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700"
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-black text-blue-400">1</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{t('example.step1_title')}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {t('example.step1_detail')}{' '}
              <span className="text-slate-300 font-bold">{t('example.step1_total')}</span>
            </p>
          </div>
        </motion.div>

        {/* Gol */}
        <AnimatePresence>
          {fase >= 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-yellow-950/40 border border-yellow-700/50"
            >
              <div className="text-2xl shrink-0">⚽</div>
              <div className="flex-1">
                <p className="text-sm font-black text-yellow-300 tracking-tight">{t('example.step2_title')}</p>
                <p className="text-xs text-yellow-700 mt-0.5">{t('example.step2_score')}</p>
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 9 }}
                className="text-emerald-400 font-mono font-black text-sm bg-emerald-950/50 px-2.5 py-1.5 rounded-xl border border-emerald-800 shrink-0"
              >
                +8%
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Precio sube */}
        <AnimatePresence>
          {fase >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50"
            >
              <div className="flex items-center gap-3">
                <img src="https://flagcdn.com/ar.svg" alt="ARG" className="w-9 h-6 object-cover rounded shadow" />
                <div>
                  <p className="text-[11px] text-slate-500 font-mono">ARG</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-600 font-mono text-sm line-through">$1,400</span>
                    <span className="text-white font-mono font-black text-2xl">
                      $<ContadorAnimado desde={1400} hasta={1512} duracion={1000} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 uppercase mb-0.5">{t('example.step3_portfolio')}</p>
                <p className="font-mono font-black text-emerald-400 text-2xl">
                  $<ContadorAnimado desde={14000} hasta={15120} duracion={1200} />
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ganancia */}
        <AnimatePresence>
          {fase >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
            >
              <TrendingUp size={20} className="text-emerald-400 shrink-0" />
              <p className="text-base font-bold text-emerald-200">
                {t('example.step4_msg_pre')}{' '}
                <span className="text-2xl font-black text-emerald-400 font-mono">$1,120</span>{' '}
                {t('example.step4_msg_post')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── PASO 4 — CTA Lobo ─────────────────────────────────────────────────────────
function StepCTA({ onClose }: { onClose: () => void }) {
  const t = useTranslations('infografia')

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[400px] px-8 py-14 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 blur-[90px] rounded-full" />
      </div>

      {/* Wolf SVG mascot */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 11, stiffness: 200 }}
        className="relative mb-6"
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Lobo de GolStreet">
          {/* Orejas */}
          <path d="M18 28L10 8L28 20Z" fill="#22c55e" opacity="0.9"/>
          <path d="M62 28L70 8L52 20Z" fill="#22c55e" opacity="0.9"/>
          <path d="M18 28L13 14L26 22Z" fill="#15803d"/>
          <path d="M62 28L67 14L54 22Z" fill="#15803d"/>
          {/* Cabeza */}
          <ellipse cx="40" cy="44" rx="26" ry="24" fill="#1e293b"/>
          <ellipse cx="40" cy="44" rx="24" ry="22" fill="#0f172a"/>
          {/* Hocico */}
          <ellipse cx="40" cy="54" rx="12" ry="9" fill="#1e293b"/>
          {/* Nariz */}
          <ellipse cx="40" cy="49" rx="5" ry="3.5" fill="#22c55e" opacity="0.8"/>
          {/* Boca — sonrisa */}
          <path d="M32 56 Q40 62 48 56" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
          {/* Ojos */}
          <circle cx="29" cy="41" r="5" fill="#0f172a"/>
          <circle cx="51" cy="41" r="5" fill="#0f172a"/>
          <circle cx="29" cy="41" r="3" fill="#22c55e" opacity="0.9"/>
          <circle cx="51" cy="41" r="3" fill="#22c55e" opacity="0.9"/>
          <circle cx="30" cy="40" r="1" fill="white"/>
          <circle cx="52" cy="40" r="1" fill="white"/>
          {/* Cejas inclinadas — expresión ambiciosa */}
          <path d="M24 35 L34 37" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
          <path d="M56 35 L46 37" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
        </svg>
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl scale-150 -z-10" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-slate-500 mb-2"
      >
        {t('cta.ready_pre')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', damping: 14 }}
      >
        <h2
          className="text-4xl sm:text-5xl font-black tracking-tight leading-tight"
          style={{ textShadow: '0 0 60px oklch(0.72 0.22 148 / 45%)' }}
        >
          <span className="text-emerald-400">{t('cta.wolf_pre')}</span>{' '}
          <span className="text-white">{t('cta.wolf_mid')}</span>
          <br />
          <span className="text-white">{t('cta.wolf_post')}</span>
        </h2>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="text-slate-600 text-xs mt-4 mb-8"
      >
        {t('cta.disclaimer')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
      >
        <Link href="/registro" onClick={onClose} className="flex-1">
          <Button
            size="lg"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-12 text-base gap-2 cursor-pointer"
            style={{ boxShadow: '0 0 40px oklch(0.72 0.22 148 / 40%)' }}
          >
            {t('cta.button')}
            <ArrowRight size={16} />
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 h-12 cursor-pointer"
          onClick={onClose}
        >
          {t('cta.explore')}
        </Button>
      </motion.div>
    </div>
  )
}

// ── Componente principal exportado ────────────────────────────────────────────
export function VerComoFuncionaBtn() {
  const t = useTranslations('infografia')
  const [abierto, setAbierto] = useState(false)
  const [paso, setPaso]       = useState(0)

  const abrir   = () => { setPaso(0); setAbierto(true) }
  const cerrar  = () => { setAbierto(false); setTimeout(() => setPaso(0), 300) }
  const anterior = () => setPaso(p => Math.max(0, p - 1))
  const siguiente = () => setPaso(p => Math.min(TOTAL_PASOS - 1, p + 1))

  // Escape
  useEffect(() => {
    if (!abierto) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [abierto])

  const pasos = [
    <StepHook key="hook" />,
    <StepEvolucion key="evo" />,
    <StepConcepto key="concepto" />,
    <StepEjemplo key="ejemplo" />,
    <StepCTA key="cta" onClose={cerrar} />,
  ]

  const esCTA = paso === TOTAL_PASOS - 1

  return (
    <>
      {/* Botón trigger */}
      <Button
        size="lg"
        variant="outline"
        className="border-border text-muted-foreground hover:text-foreground hover:bg-card px-8 h-12 text-base cursor-pointer"
        onClick={abrir}
      >
        {t('trigger')}
      </Button>

      {/* Modal */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={cerrar}
            />

            {/* Panel */}
            <motion.div
              className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/60"
              initial={{ scale: 0.88, opacity: 0, y: 32 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 32 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Barra de progreso */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-800 z-10">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  animate={{ width: `${((paso + 1) / TOTAL_PASOS) * 100}%` }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                />
              </div>

              {/* Botón cerrar */}
              <button
                onClick={cerrar}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>

              {/* Contenido del paso */}
              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={paso}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                  >
                    {pasos[paso]}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer de navegación (no en el CTA) */}
              {!esCTA && (
                <div className="flex items-center justify-between px-6 pb-5 pt-3 border-t border-slate-800/60">
                  {/* Dots */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: TOTAL_PASOS }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPaso(i)}
                        aria-label={`${t('step')} ${i + 1}`}
                        className={`rounded-full transition-all duration-200 cursor-pointer ${
                          i === paso
                            ? 'w-5 h-2 bg-emerald-400'
                            : i < paso
                            ? 'w-2 h-2 bg-emerald-700/60'
                            : 'w-2 h-2 bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Prev / Next */}
                  <div className="flex items-center gap-2">
                    {paso > 0 && (
                      <button
                        onClick={anterior}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <ChevronLeft size={14} /> {t('back')}
                      </button>
                    )}
                    <button
                      onClick={siguiente}
                      className="flex items-center gap-1.5 text-sm font-bold text-black bg-emerald-500 hover:bg-emerald-400 px-5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                      style={{ boxShadow: '0 0 20px oklch(0.72 0.22 148 / 30%)' }}
                    >
                      {t('next')} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Dots en CTA */}
              {esCTA && (
                <div className="flex items-center justify-center gap-1.5 pb-5 pt-3 border-t border-slate-800/60">
                  {Array.from({ length: TOTAL_PASOS }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPaso(i)}
                      aria-label={`${t('step')} ${i + 1}`}
                      className={`rounded-full transition-all duration-200 cursor-pointer ${
                        i === paso
                          ? 'w-5 h-2 bg-emerald-400'
                          : i < paso
                          ? 'w-2 h-2 bg-emerald-700/60'
                          : 'w-2 h-2 bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
