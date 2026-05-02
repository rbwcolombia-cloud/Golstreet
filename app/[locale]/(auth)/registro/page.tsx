'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { crearClienteSupabase } from '@/lib/supabase/client'
import { LogoGolStreet } from '@/components/ui/logo-golstreet'
import { User, Mail, Lock, ArrowRight, Check, Eye, EyeOff } from 'lucide-react'

export default function PaginaRegistro() {
  const t = useTranslations('auth.register')
  const [nombre, setNombre]         = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando]     = useState(false)
  const router   = useRouter()
  const supabase = crearClienteSupabase()

  const beneficios = t.raw('benefits') as string[]

  const registrarse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setCargando(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nombre } },
    })
    if (error) toast.error(error.message ?? t('error_generic'))
    else {
      toast.success('¡Cuenta creada! Revisa tu correo para confirmar.')
      router.push('/onboarding')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Panel izquierdo (decorativo, solo desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col justify-between p-12 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-emerald-500/8 blur-[120px] rounded-full" />
        </div>

        <LogoGolStreet size="lg" />

        <div className="space-y-6 relative">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Únete al mercado más emocionante del Mundial
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Compra y vende partes de selecciones nacionales. Gana con cada gol,
              sufre con cada tarjeta roja. El mercado vive el partido.
            </p>
          </div>

          <div className="space-y-3">
            {beneficios.map((texto, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-700/40 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-emerald-400" aria-hidden="true" />
                </div>
                <span className="text-sm text-muted-foreground">{texto}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground/50">
          {t('footer')}
        </p>
      </div>

      {/* ── Panel derecho: formulario ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">

          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:hidden mb-8">
              <LogoGolStreet size="md" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">{t('title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('subtitle')}
            </p>
          </div>

          <form onSubmit={registrarse} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('name_label')}
              </Label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="nombre"
                  type="text"
                  placeholder={t('name_placeholder')}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="bg-muted/30 border-border pl-10 h-11"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

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
                  placeholder={t('password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted/30 border-border pl-10 pr-10 h-11"
                  required
                  minLength={6}
                  autoComplete="new-password"
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

          <p className="text-center text-[11px] text-muted-foreground/40">
            {t('disclaimer')}
          </p>

          <div className="border-t border-border pt-5 text-center text-sm">
            <span className="text-muted-foreground">{t('has_account')} </span>
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer">
              {t('login_link')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
