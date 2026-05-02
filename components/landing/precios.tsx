import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Check, ArrowRight, Zap, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Componente ───────────────────────────────────────────────────────────────

export function SeccionPrecios() {
  const t = useTranslations('pricing')

  const PLANES = [
    {
      id: 'amigos',
      nombre: t('plans.amigos.name'),
      rango: t('plans.amigos.range'),
      precio: t('plans.amigos.price'),
      unidad: t('currency'),
      descripcion: t('plans.amigos.desc'),
      badge: null,
      destacado: false,
      cta: t('cta_create'),
      ctaHref: '/crear-liga',
      ctaVariante: 'outline' as const,
      features: t.raw('plans.amigos.features') as string[],
      ideal: t('plans.amigos.ideal'),
      color: 'border-slate-800 bg-slate-900/50',
      badgeColor: '',
      featureColor: 'text-slate-300',
      priceColor: 'text-white',
    },
    {
      id: 'empresa-s',
      nombre: t('plans.empresa_s.name'),
      rango: t('plans.empresa_s.range'),
      precio: t('plans.empresa_s.price'),
      unidad: t('currency'),
      descripcion: t('plans.empresa_s.desc'),
      badge: t('badge_popular'),
      destacado: true,
      cta: t('cta_start'),
      ctaHref: '/crear-liga',
      ctaVariante: 'default' as const,
      features: t.raw('plans.empresa_s.features') as string[],
      ideal: t('plans.empresa_s.ideal'),
      color: 'border-emerald-600/60 bg-emerald-950/20',
      badgeColor: 'bg-emerald-500 text-black',
      featureColor: 'text-slate-200',
      priceColor: 'text-emerald-400',
    },
    {
      id: 'empresa-m',
      nombre: t('plans.empresa_m.name'),
      rango: t('plans.empresa_m.range'),
      precio: t('plans.empresa_m.price'),
      unidad: t('currency'),
      descripcion: t('plans.empresa_m.desc'),
      badge: null,
      destacado: false,
      cta: t('cta_create'),
      ctaHref: '/crear-liga',
      ctaVariante: 'outline' as const,
      features: t.raw('plans.empresa_m.features') as string[],
      ideal: t('plans.empresa_m.ideal'),
      color: 'border-slate-700 bg-slate-900/40',
      badgeColor: '',
      featureColor: 'text-slate-300',
      priceColor: 'text-white',
    },
    {
      id: 'enterprise',
      nombre: t('plans.enterprise.name'),
      rango: t('plans.enterprise.range'),
      precio: t('plans.enterprise.price'),
      unidad: t('currency_quote'),
      descripcion: t('plans.enterprise.desc'),
      badge: t('badge_custom'),
      destacado: false,
      cta: t('cta_quote'),
      ctaHref: 'https://wa.me/573000000000?text=Hola%2C%20quiero%20cotizar%20GolStreet%20Enterprise',
      ctaVariante: 'outline' as const,
      features: t.raw('plans.enterprise.features') as string[],
      ideal: t('plans.enterprise.ideal'),
      color: 'border-purple-800/50 bg-purple-950/15',
      badgeColor: 'bg-purple-600 text-white',
      featureColor: 'text-slate-300',
      priceColor: 'text-purple-300',
    },
  ]

  return (
    <section className="container mx-auto max-w-6xl px-4 py-24">
      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-xs font-bold text-emerald-400 tracking-widest uppercase mb-3">{t('label')}</p>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          {t('title')}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
          {t('subtitle')}
        </p>
      </div>

      {/* Grid de planes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {PLANES.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-3xl border p-6 transition-all duration-200 hover:-translate-y-0.5 ${plan.color} ${
              plan.destacado
                ? 'ring-1 ring-emerald-500/40 shadow-xl shadow-emerald-500/10'
                : 'shadow-lg shadow-black/20'
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              <span
                className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-black px-3 py-1 rounded-full ${plan.badgeColor}`}
              >
                {plan.badge}
              </span>
            )}

            {/* Nombre + rango */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">{plan.rango}</p>
              <h3 className="text-base font-extrabold text-white leading-tight">{plan.nombre}</h3>
              <p className="text-xs text-muted-foreground/70 mt-1 leading-snug">{plan.descripcion}</p>
            </div>

            {/* Precio */}
            <div className="mb-6 pb-6 border-b border-white/5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={`text-2xl font-black font-mono leading-none ${plan.priceColor}`}>
                  ${plan.precio}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-1 font-mono">{plan.unidad}</p>
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-7 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check
                    size={13}
                    className={`shrink-0 mt-0.5 ${
                      plan.destacado ? 'text-emerald-400' : 'text-emerald-600'
                    }`}
                  />
                  <span className={`text-xs leading-snug ${plan.featureColor}`}>{f}</span>
                </li>
              ))}
            </ul>

            {/* Ideal para */}
            <div className="mb-5 p-3 rounded-xl bg-black/20 border border-white/5">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1">{t('ideal_label')}</p>
              <p className="text-xs text-muted-foreground/80 leading-snug">{plan.ideal}</p>
            </div>

            {/* CTA */}
            {plan.id === 'enterprise' ? (
              <a
                href={plan.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-10 rounded-xl border border-purple-700/60 text-purple-300 hover:bg-purple-500/10 hover:border-purple-600 text-sm font-semibold transition-all cursor-pointer"
              >
                <MessageCircle size={14} />
                {plan.cta}
              </a>
            ) : plan.destacado ? (
              <Link href={plan.ctaHref}>
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold gap-2 cursor-pointer"
                  style={{ boxShadow: '0 0 24px oklch(0.72 0.22 148 / 35%)' }}
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </Button>
              </Link>
            ) : (
              <Link href={plan.ctaHref}>
                <Button
                  variant="outline"
                  className="w-full border-slate-700 text-muted-foreground hover:text-white hover:border-slate-500 gap-2 cursor-pointer"
                >
                  {plan.cta}
                  <ArrowRight size={14} />
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Nota al pie */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-muted-foreground/50">
        <span className="flex items-center gap-1.5">
          <Zap size={11} className="text-emerald-600" />
          {t('footer_unique')}
        </span>
        <span className="hidden sm:block w-px h-3 bg-border" />
        <span className="flex items-center gap-1.5">
          <Check size={11} className="text-emerald-600" />
          {t('footer_virtual')}
        </span>
        <span className="hidden sm:block w-px h-3 bg-border" />
        <span className="flex items-center gap-1.5">
          <Check size={11} className="text-emerald-600" />
          {t('footer_active')}
        </span>
      </div>
    </section>
  )
}
