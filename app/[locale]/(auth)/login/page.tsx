'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { crearClienteSupabase } from '@/lib/supabase/client'
import { LogoGolStreet } from '@/components/ui/logo-golstreet'
import { Mail, Lock, ArrowRight, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react'

const tickerMini = [
  { pais: 'FRA', cambio: 2.3, positivo: true },
  { pais: 'COL', cambio: 15.2, positivo: true },
  { pais: 'ARG', cambio: 8.5, positivo: true },
  { pais: 'MAR', cambio: -4.5, positivo: false },
  { pais: 'ESP', cambio: -1.2, positivo: false },
  { pais: 'JPN', cambio: 12.3, positivo: true },
]

export default function PaginaLogin() {
  const t = useTranslations('auth.login')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando]     = useState(false)
  const router  = useRouter()
  const supabase = crearClienteSupabase()

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        toast.error('Confirma tu correo antes de ingresar. Revisa tu bandeja de entrada.')
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Email o contraseña incorrectos.')
      } else {
        toast.error(error.message)
      }
    } else {
      router.push('/mercado')
      router.refresh()
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Panel izquierdo (decorativo, solo desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute bottom-1/3 left-1/3 w-[350px] h-[350px] bg-emerald-500/8 blur-[100px] rounded-full" />
        </div>

        {/* Logo */}
        <LogoGolStreet size="lg" />

        {/* Market preview cards */}
        <div className="space-y-3 relative">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {t('market_live')}
          </p>
          {tickerMini.map((item) => (
            <div
              key={item.pais}
              className="flex items-center justify-between bg-background/40 border border-border/60 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <img
                  src={`https://flagcdn.com/${item.pais.toLowerCase().slice(0,2)}.svg`}
                  alt={item.pais}
                  className="w-8 h-5 object-cover rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none' }}
                />
                <span className="font-mono text-sm font-semibold text-foreground tracking-wider">{item.pais}</span>
              </div>
              <span className={`flex items-center gap-1 font-mono text-sm font-bold ${item.positivo ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.positivo ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
                {item.positivo ? '+' : ''}{item.cambio}%
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/50">
          {t('footer')}
        </p>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">

          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:hidden mb-8">
              <LogoGolStreet size="md" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={iniciarSesion} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('email_label')}
              </Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted/30 border-border pl-10 h-11"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('password_label')}
              </Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="password"
                  type={verPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/30 border-border pl-10 pr-10 h-11"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {verPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={cargando}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-12 text-base gap-2 mt-2 cursor-pointer disabled:opacity-50"
              style={{ boxShadow: 'var(--gs-glow)' }}
            >
              {cargando ? t('loading') : (
                <>{t('cta')} <ArrowRight size={15} /></>
              )}
            </Button>
          </form>

          <div className="border-t border-border pt-5 text-center text-sm">
            <span className="text-muted-foreground">{t('no_account')} </span>
            <Link href="/registro" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer">
              {t('register_link')}
            </Link>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/40">
            {t('disclaimer')}
          </p>
        </div>
      </div>
    </div>
  )
}
