'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

export function LanguageSwitcher() {
  const locale     = useLocale()
  const pathname   = usePathname() // ruta SIN prefijo de locale
  const router     = useRouter()   // router locale-aware de next-intl

  const otroLocale = locale === 'es' ? 'en' : 'es'
  const label      = locale === 'es' ? 'EN' : 'ES'

  const cambiarIdioma = () => {
    // next-intl maneja el prefijo automáticamente
    router.push(pathname, { locale: otroLocale })
  }

  return (
    <button
      onClick={cambiarIdioma}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-emerald-500/40 hover:bg-emerald-950/20 transition-all cursor-pointer"
      aria-label={`Switch to ${otroLocale === 'es' ? 'Spanish' : 'English'}`}
    >
      <span className="text-[10px] opacity-50">
        {locale === 'es' ? '🇪🇸' : '🇺🇸'}
      </span>
      {label}
    </button>
  )
}
