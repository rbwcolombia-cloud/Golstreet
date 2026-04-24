'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { BarChart2, Briefcase, Trophy, HelpCircle, Settings, Coins } from 'lucide-react'
import { LogoGolStreet } from '@/components/ui/logo-golstreet'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

interface NavegacionPrincipalProps {
  tenantId: string
  saldoCoins: number
}

export function NavegacionPrincipal({ saldoCoins }: NavegacionPrincipalProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const RUTAS = [
    { href: '/mercado',    etiqueta: t('app.market'),    icono: BarChart2 },
    { href: '/portafolio', etiqueta: t('app.portfolio'), icono: Briefcase },
    { href: '/liga',       etiqueta: t('app.league'),    icono: Trophy },
    { href: '/faq',        etiqueta: t('app.help'),      icono: HelpCircle },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/mercado" className="shrink-0 cursor-pointer" aria-label="GolStreet — Inicio">
          <LogoGolStreet size="md" />
        </Link>

        {/* Links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          {RUTAS.map(({ href, etiqueta, icono: Icono }) => {
            const activo = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
                  ${activo
                    ? 'text-emerald-400 bg-emerald-950/40'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                <Icono size={15} aria-hidden="true" />
                {etiqueta}
                {activo && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" aria-hidden="true" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Saldo + Admin */}
        <div className="flex items-center gap-2">
          {/* Saldo */}
          <div className="hidden sm:flex items-center gap-2.5 bg-muted/50 border border-border rounded-xl px-3.5 py-2 cursor-default">
            <Coins size={14} className="text-emerald-400 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none mb-0.5 font-medium uppercase tracking-wide">
                {t('balance')}
              </p>
              <p className="text-sm font-mono font-bold text-emerald-400 leading-none tabular-nums">
                ${saldoCoins.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Admin */}
          <Link
            href="/admin"
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            title="Panel admin"
            aria-label="Panel de administración"
          >
            <Settings size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* ── Navegación móvil ── */}
      <div className="md:hidden flex border-t border-border bg-background/95">
        {RUTAS.map(({ href, etiqueta, icono: Icono }) => {
          const activo = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors cursor-pointer
                ${activo
                  ? 'text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground/80'
                }`}
              aria-current={activo ? 'page' : undefined}
            >
              <Icono size={18} aria-hidden="true" />
              {etiqueta}
              {activo && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-400" aria-hidden="true" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
