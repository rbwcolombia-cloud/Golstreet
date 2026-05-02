'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { crearClienteSupabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoGolStreet } from '@/components/ui/logo-golstreet'
import { toast } from 'sonner'
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function ActualizarContrasena() {
  const [password, setPassword]         = useState('')
  const [confirmar, setConfirmar]       = useState('')
  const [verPassword, setVerPassword]   = useState(false)
  const [cargando, setCargando]         = useState(false)
  const router  = useRouter()
  const supabase = crearClienteSupabase()

  const actualizar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres')
    if (password !== confirmar) return toast.error('Las contraseñas no coinciden')

    setCargando(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error('Error al actualizar. El link puede haber expirado — solicita uno nuevo.')
    } else {
      toast.success('¡Contraseña actualizada! Ingresando...')
      setTimeout(() => router.push('/mercado'), 1500)
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">

        <div className="text-center">
          <div className="flex justify-center mb-6">
            <LogoGolStreet size="md" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Nueva contraseña</h1>
          <p className="text-muted-foreground text-sm">Elige una contraseña segura para tu cuenta.</p>
        </div>

        <form onSubmit={actualizar} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nueva contraseña
            </Label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type={verPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/30 border-border pl-10 pr-10 h-11"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setVerPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {verPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type={verPassword ? 'text' : 'password'}
                placeholder="Repite la contraseña"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="bg-muted/30 border-border pl-10 h-11"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={cargando}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-12 text-base gap-2 cursor-pointer disabled:opacity-50"
            style={{ boxShadow: 'var(--gs-glow)' }}
          >
            {cargando ? 'Actualizando...' : <>Guardar nueva contraseña <ArrowRight size={15} /></>}
          </Button>
        </form>
      </div>
    </div>
  )
}
