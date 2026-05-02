import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogoGolStreet } from '@/components/ui/logo-golstreet'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { VerComoFuncionaBtn } from '@/components/landing/infografia-como-funciona'
import { CountdownMundial } from '@/components/landing/countdown-mundial'
import { PreRegistroEventos } from '@/components/landing/pre-registro-eventos'
import { SeccionPrecios } from '@/components/landing/precios'
import {
  Zap, Bot, Trophy, Tv, Coins, ShieldCheck,
  TrendingUp, TrendingDown, ArrowRight, ChevronRight
} from 'lucide-react'

const tickerSimulado = [
  { pais: 'FRA', precio: 1500, cambio: 2.3 },
  { pais: 'ESP', precio: 1450, cambio: -1.2 },
  { pais: 'ARG', precio: 1520, cambio: 8.5 },
  { pais: 'BRA', precio: 1380, cambio: 3.1 },
  { pais: 'COL', precio: 920,  cambio: 15.2 },
  { pais: 'MAR', precio: 760,  cambio: -4.5 },
  { pais: 'JPN', precio: 680,  cambio: 12.3 },
  { pais: 'NGA', precio: 480,  cambio: -8.1 },
  { pais: 'ENG', precio: 1290, cambio: -0.8 },
  { pais: 'GER', precio: 1200, cambio: 1.9 },
  { pais: 'POR', precio: 1100, cambio: 5.7 },
  { pais: 'MEX', precio: 780,  cambio: -2.3 },
]

export default function LandingPage() {
  const t = useTranslations()

  const features = [
    {
      icono: Zap,
      titulo: t('landing.features.realtime.title'),
      desc: t('landing.features.realtime.desc'),
      color: 'text-yellow-400',
      bg: 'bg-yellow-950/30 border-yellow-900/40',
    },
    {
      icono: Bot,
      titulo: t('landing.features.ai.title'),
      desc: t('landing.features.ai.desc'),
      color: 'text-blue-400',
      bg: 'bg-blue-950/30 border-blue-900/40',
    },
    {
      icono: Trophy,
      titulo: t('landing.features.league.title'),
      desc: t('landing.features.league.desc'),
      color: 'text-amber-400',
      bg: 'bg-amber-950/30 border-amber-900/40',
    },
    {
      icono: Tv,
      titulo: t('landing.features.screen.title'),
      desc: t('landing.features.screen.desc'),
      color: 'text-purple-400',
      bg: 'bg-purple-950/30 border-purple-900/40',
    },
    {
      icono: Coins,
      titulo: t('landing.features.prizes.title'),
      desc: t('landing.features.prizes.desc'),
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/30 border-emerald-900/40',
    },
    {
      icono: ShieldCheck,
      titulo: t('landing.features.safe.title'),
      desc: t('landing.features.safe.desc'),
      color: 'text-slate-400',
      bg: 'bg-slate-800/30 border-slate-700/40',
    },
  ]

  const eventosEjemplo = [
    { evento: t('landing.events.goal'),        icono: '⚽', impacto: '+8%',  positivo: true },
    { evento: t('landing.events.hattrick'),    icono: '⚽', impacto: '+30%', positivo: true },
    { evento: t('landing.events.redCard'),     icono: '🟥', impacto: '-18%', positivo: false },
    { evento: t('landing.events.penaltySave'), icono: '🧤', impacto: '+12%', positivo: true },
    { evento: t('landing.events.injury'),      icono: '🏥', impacto: '-10%', positivo: false },
    { evento: t('landing.events.thrashing'),   icono: '📉', impacto: '-35%', positivo: false },
    { evento: t('landing.events.brace'),       icono: '⚽', impacto: '+15%', positivo: true },
    { evento: t('landing.events.starExpelled'),icono: '🟥', impacto: '-28%', positivo: false },
  ]

  const equipos = [
    { nombre: 'Francia',    codigo: 'FRA', ipo: 1500, riesgo: t('landing.ipo.risk_low'),         riesgoColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
    { nombre: 'España',     codigo: 'ESP', ipo: 1450, riesgo: t('landing.ipo.risk_low'),         riesgoColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50' },
    { nombre: 'Argentina',  codigo: 'ARG', ipo: 1400, riesgo: t('landing.ipo.risk_medium'),      riesgoColor: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/50' },
    { nombre: 'Brasil',     codigo: 'BRA', ipo: 1350, riesgo: t('landing.ipo.risk_medium'),      riesgoColor: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/50' },
    { nombre: 'Inglaterra', codigo: 'ENG', ipo: 1300, riesgo: t('landing.ipo.risk_medium'),      riesgoColor: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/50' },
    { nombre: 'Colombia',   codigo: 'COL', ipo: 850,  riesgo: t('landing.ipo.risk_high'),        riesgoColor: 'text-orange-400 bg-orange-950/40 border-orange-800/50' },
    { nombre: 'Marruecos',  codigo: 'MAR', ipo: 800,  riesgo: t('landing.ipo.risk_high'),        riesgoColor: 'text-orange-400 bg-orange-950/40 border-orange-800/50' },
    { nombre: 'Japón',      codigo: 'JPN', ipo: 600,  riesgo: t('landing.ipo.risk_high'),        riesgoColor: 'text-orange-400 bg-orange-950/40 border-orange-800/50' },
    { nombre: 'Nigeria',    codigo: 'NGA', ipo: 500,  riesgo: t('landing.ipo.risk_high'),        riesgoColor: 'text-orange-400 bg-orange-950/40 border-orange-800/50' },
    { nombre: 'Uzbekistán', codigo: 'UZB', ipo: 150,  riesgo: t('landing.ipo.risk_speculative'), riesgoColor: 'text-red-400 bg-red-950/40 border-red-800/50' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navbar flotante ── */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg shadow-black/40">
          <LogoGolStreet size="md" />
          <div className="hidden md:flex items-center gap-1">
            <Link href="/faq">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">
                {t('nav.landing.how')}
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm">
                {t('nav.landing.login')}
              </Button>
            </Link>
            <Link href="/registro" className="hidden sm:block">
              <Button size="sm" variant="outline" className="border-border text-foreground hover:bg-muted/30 font-semibold">
                {t('nav.landing.join')}
              </Button>
            </Link>
            <Link href="/crear-liga">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-background font-semibold shadow-md text-xs sm:text-sm" style={{ boxShadow: 'var(--gs-glow-sm)' }}>
                {t('nav.landing.create')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 px-4 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/8 blur-[120px] rounded-full" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <Badge
            variant="outline"
            className="border-emerald-800/60 bg-emerald-950/40 text-emerald-400 text-xs font-medium px-3 py-1 mb-8 inline-flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('landing.hero.badge')}
          </Badge>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-[1.05] tracking-tight">
            {t('landing.hero.title_pre')}{' '}
            <span className="text-emerald-400" style={{ textShadow: '0 0 40px oklch(0.72 0.22 148 / 30%)' }}>
              {t('landing.hero.title_highlight')}
            </span>
            <br />{t('landing.hero.title_post')}
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/crear-liga">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold px-8 h-12 text-base gap-2 cursor-pointer"
                style={{ boxShadow: 'var(--gs-glow)' }}
              >
                {t('landing.hero.cta_primary')}
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/registro">
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-muted/30 px-8 h-12 text-base gap-2 cursor-pointer"
              >
                {t('landing.hero.cta_join')}
              </Button>
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-6 text-xs text-muted-foreground/60">
            {t('landing.hero.social_proof')}
          </p>
        </div>
      </section>

      {/* ── Ticker en vivo ── */}
      <div className="border-y border-border bg-card/40 backdrop-blur-sm py-2.5 overflow-hidden">
        <div className="flex gap-0 animate-ticker whitespace-nowrap">
          {[...tickerSimulado, ...tickerSimulado].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-xs font-mono px-5 border-r border-border/40 last:border-r-0"
            >
              <span className="font-semibold text-foreground/90 text-[11px] tracking-wider">{item.pais}</span>
              <span className="text-muted-foreground">${item.precio.toLocaleString('es-CO')}</span>
              <span className={`inline-flex items-center gap-0.5 font-bold ${item.cambio > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.cambio > 0
                  ? <TrendingUp size={11} />
                  : <TrendingDown size={11} />}
                {item.cambio > 0 ? '+' : ''}{item.cambio}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Countdown Mundial ── */}
      <CountdownMundial />

      {/* ── Features bento grid ── */}
      <section className="container mx-auto max-w-5xl px-4 py-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-emerald-400 tracking-widest uppercase mb-3">{t('landing.features.label')}</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('landing.features.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-6 transition-all duration-200 hover:border-border/80 hover:-translate-y-0.5 cursor-default ${f.bg}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-background/30 ${f.color}`}>
                <f.icono size={20} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.titulo}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Eventos del mercado ── */}
      <section className="container mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-emerald-400 tracking-widest uppercase mb-3">{t('landing.events.label')}</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            {t('landing.events.title')}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t('landing.events.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {eventosEjemplo.map((e, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 text-center transition-all duration-150 hover:-translate-y-0.5 cursor-default ${
                e.positivo
                  ? 'bg-emerald-950/20 border-emerald-900/40 hover:border-emerald-700/60'
                  : 'bg-red-950/20 border-red-900/40 hover:border-red-700/60'
              }`}
            >
              <p className="text-2xl mb-2">{e.icono}</p>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium">{e.evento}</p>
              <p className={`text-xl font-mono font-bold ${e.positivo ? 'text-emerald-400' : 'text-red-400'}`}>
                {e.impacto}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── IPO Table ── */}
      <section className="container mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-emerald-400 tracking-widest uppercase mb-3">{t('landing.ipo.label')}</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{t('landing.ipo.title')}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('landing.ipo.subtitle')} <strong className="text-foreground">{t('landing.ipo.subtitle2')}</strong>{' '}
            {t('landing.ipo.subtitle3')}
          </p>
        </div>

        {/* Banner 48 equipos */}
        <div className="flex items-center justify-between gap-4 p-4 mb-5 rounded-2xl bg-emerald-950/20 border border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t('landing.ipo.banner_title')}</p>
              <p className="text-xs text-muted-foreground">{t('landing.ipo.banner_desc')}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-3 py-1.5 rounded-full shrink-0">
            {t('landing.ipo.preview')}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-4 px-5 py-3 border-b border-border bg-muted/30">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('landing.ipo.col_team')}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('landing.ipo.col_code')}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('landing.ipo.col_ipo')}</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">{t('landing.ipo.col_risk')}</span>
          </div>
          {equipos.map((eq, i) => (
            <div
              key={eq.codigo}
              className={`grid grid-cols-4 items-center px-5 py-3.5 border-b border-border/50 last:border-b-0 transition-colors hover:bg-muted/20 cursor-default ${i % 2 === 0 ? '' : 'bg-muted/5'}`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={`https://flagcdn.com/${eq.codigo.toLowerCase().slice(0, 2)}.svg`}
                  alt={eq.nombre}
                  className="w-7 h-5 object-cover rounded-sm opacity-90"
                />
                <span className="font-medium text-foreground text-sm">{eq.nombre}</span>
              </div>
              <span className="text-right font-mono text-xs text-muted-foreground tracking-widest">{eq.codigo}</span>
              <span className="text-right font-mono font-bold text-emerald-400">
                ${eq.ipo.toLocaleString('es-CO')}
              </span>
              <div className="flex justify-end">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${eq.riesgoColor}`}>
                  {eq.riesgo}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer tabla — 38 equipos más */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-muted/10 border border-border/60">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {t('landing.ipo.showing')} <strong className="text-foreground">10 {t('landing.ipo.of')} 48</strong> {t('landing.ipo.remaining', { count: 38 })}
            </span>
          </div>
          <Link href="/registro">
            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-background font-semibold text-xs gap-1.5 cursor-pointer shrink-0">
              {t('landing.ipo.viewAll')}
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Precios ── */}
      <SeccionPrecios />

      {/* ── Pre-registro eventos futuros ── */}
      <PreRegistroEventos />

      {/* ── CTA final ── */}
      <section className="relative container mx-auto max-w-5xl px-4 py-24">
        <div className="relative rounded-3xl border border-emerald-900/40 bg-emerald-950/20 p-12 text-center overflow-hidden">
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-emerald-500/10 blur-[80px] rounded-full" />
          </div>

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('landing.cta.title')}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t('landing.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/crear-liga">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-400 text-background font-bold px-10 h-12 text-base gap-2 cursor-pointer"
                  style={{ boxShadow: 'var(--gs-glow)' }}
                >
                  {t('landing.cta.button')}
                  <ChevronRight size={16} />
                </Button>
              </Link>
              <Link href="/registro">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/20 px-8 h-12 text-base gap-2 cursor-pointer"
                >
                  {t('landing.hero.cta_join')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-8">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <LogoGolStreet size="sm" />
          <div className="text-center text-xs text-muted-foreground/50 leading-relaxed">
            <p>{t('landing.footer.disclaimer')}</p>
            <p className="mt-0.5">{t('landing.footer.rights')}</p>
          </div>
          <Link href="/faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t('landing.footer.faq')}
          </Link>
        </div>
      </footer>
    </div>
  )
}
