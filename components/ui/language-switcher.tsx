'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale    = useLocale()
  const t         = useTranslations('nav')
  const pathname  = usePathname()
  const router    = useRouter()

  const otroLocale = locale === 'es' ? 'en' : 'es'
  const label      = locale === 'es' ? 'EN' : 'ES'

  const cambiarIdioma = () => {
    // Quitar el prefijo del locale actual y poner el nuevo
    let newPath = pathname

    // Si el pathname empieza con /locale/ → reemplazar
    const match = pathname.match(/^\/(es|en)(\/|$)/)
    if (match) {
      newPath = pathname.replace(/^\/(es|en)/, otroLocale === routing.defaultLocale ? '' : `/${otroLocale}`)
    } else {
      // Sin prefijo → es el default locale (es), cambiar a en
      newPath = otroLocale === routing.defaultLocale ? pathname : `/${otroLocale}${pathname}`
    }

    router.push(newPath || '/')
    router.refresh()
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
