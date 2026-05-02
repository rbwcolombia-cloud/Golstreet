'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoGolStreet } from '@/components/ui/logo-golstreet'
import {
  Shield, Users, Building2, Plus, ExternalLink,
  Lock, Unlock, ChevronRight, Settings
} from 'lucide-react'
import Link from 'next/link'

interface Tenant {
  id: string
  nombre: string
  slug: string
  email_admin: string
  plan: string
  mercado_activo: boolean
  modo_acceso: string
  inscripciones_abiertas: boolean
  coins_iniciales: number
  fecha_creacion: string
  total_jugadores: number
}

interface SuperAdminClienteProps {
  adminEmail: string
  tenants: Tenant[]
}

export function SuperAdminCliente({ adminEmail, tenants: tenantsIniciales }: SuperAdminClienteProps) {
  const [tenants, setTenants] = useState(tenantsIniciales)
  const [creando, setCreando] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoSlug, setNuevoSlug] = useState('')
  const [nuevoEmailAdmin, setNuevoEmailAdmin] = useState('')
  const [nuevoPlan, setNuevoPlan] = useState<'gratuito' | 'pro' | 'enterprise'>('pro')
  const [nuevoCoins, setNuevoCoins] = useState('10000')

  const crearTenant = async () => {
    if (!nuevoNombre || !nuevoSlug || !nuevoEmailAdmin) {
      return toast.error('Completa todos los campos requeridos')
    }
    setCreando(true)
    const res = await fetch('/api/super-admin/crear-liga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevoNombre,
        slug: nuevoSlug.toLowerCase().replace(/\s/g, '-'),
        email_admin: nuevoEmailAdmin.toLowerCase(),
        plan: nuevoPlan,
        coins_iniciales: parseInt(nuevoCoins),
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Liga "${nuevoNombre}" creada`)
      setTenants(prev => [data.tenant, ...prev])
      setNuevoNombre('')
      setNuevoSlug('')
      setNuevoEmailAdmin('')
      setMostrarFormulario(false)
    } else {
      toast.error(data.error ?? 'Error al crear la liga')
    }
    setCreando(false)
  }

  const totalJugadores = tenants.reduce((s, t) => s + t.total_jugadores, 0)
  const ligasActivas = tenants.filter(t => t.mercado_activo).length

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoGolStreet size="sm" />
          <div className="w-px h-5 bg-zinc-700" />
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-red-400" />
            <span className="text-sm font-semibold text-red-400 tracking-wide uppercase">Super Admin</span>
          </div>
        </div>
        <p className="text-xs text-zinc-500">{adminEmail}</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Ligas creadas', value: tenants.length, color: 'text-emerald-400' },
            { label: 'Ligas activas', value: ligasActivas, color: 'text-blue-400' },
            { label: 'Total jugadores', value: totalJugadores, color: 'text-purple-400' },
            { label: 'Plan promedio', value: 'Pro', color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Crear liga */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            <div className="flex items-center gap-2">
              <Plus size={15} className="text-emerald-400" />
              <span className="font-semibold text-sm">Crear nueva liga</span>
            </div>
            <ChevronRight size={14} className={`text-zinc-500 transition-transform ${mostrarFormulario ? 'rotate-90' : ''}`} />
          </div>

          {mostrarFormulario && (
            <div className="px-5 pb-5 border-t border-zinc-800 pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wider">Nombre de la liga *</Label>
                  <Input
                    placeholder="Empresa XYZ — Mundial 2026"
                    value={nuevoNombre}
                    onChange={e => setNuevoNombre(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wider">Slug (código de la liga) *</Label>
                  <Input
                    placeholder="empresa-xyz-2026"
                    value={nuevoSlug}
                    onChange={e => setNuevoSlug(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                    className="bg-zinc-800 border-zinc-700 font-mono"
                  />
                  <p className="text-[11px] text-zinc-600">Los jugadores usarán este código para unirse.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wider">Email del admin de la liga *</Label>
                  <Input
                    type="email"
                    placeholder="organizador@empresa.com"
                    value={nuevoEmailAdmin}
                    onChange={e => setNuevoEmailAdmin(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <p className="text-[11px] text-zinc-600">Este correo tendrá acceso al panel admin de la liga automáticamente.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Plan</Label>
                    <select
                      value={nuevoPlan}
                      onChange={e => setNuevoPlan(e.target.value as 'gratuito' | 'pro' | 'enterprise')}
                      className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-200 focus:outline-none"
                    >
                      <option value="gratuito">Gratuito</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Coins iniciales</Label>
                    <Input
                      type="number"
                      value={nuevoCoins}
                      onChange={e => setNuevoCoins(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 font-mono"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={crearTenant}
                disabled={creando || !nuevoNombre || !nuevoSlug || !nuevoEmailAdmin}
                className="bg-emerald-600 hover:bg-emerald-500 gap-2"
              >
                <Plus size={14} />
                {creando ? 'Creando...' : 'Crear liga'}
              </Button>
            </div>
          )}
        </div>

        {/* Lista de ligas */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Todas las ligas ({tenants.length})
          </h2>

          {tenants.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <Building2 size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">Aún no hay ligas creadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-zinc-100 truncate">{tenant.nombre}</p>
                      <Badge
                        className={`text-[10px] shrink-0 ${
                          tenant.plan === 'enterprise' ? 'bg-purple-900/50 text-purple-300 border-purple-700' :
                          tenant.plan === 'pro' ? 'bg-blue-900/50 text-blue-300 border-blue-700' :
                          'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                        variant="outline"
                      >
                        {tenant.plan}
                      </Badge>
                      {tenant.mercado_activo
                        ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Mercado activo" />
                        : <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" title="Mercado inactivo" />
                      }
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="font-mono text-zinc-400">/{tenant.slug}</span>
                      <span className="flex items-center gap-1">
                        <Users size={10} /> {tenant.total_jugadores} jugadores
                      </span>
                      <span>{tenant.email_admin}</span>
                      {tenant.modo_acceso === 'invitacion'
                        ? <span className="flex items-center gap-1 text-yellow-500"><Lock size={10} /> invitación</span>
                        : <span className="flex items-center gap-1 text-emerald-600"><Unlock size={10} /> abierto</span>
                      }
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/live/${tenant.slug}`}
                      target="_blank"
                      className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Ver pantalla pública"
                    >
                      <ExternalLink size={14} />
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs gap-1"
                      onClick={() => {
                        // Copiar el slug al clipboard
                        navigator.clipboard.writeText(tenant.slug)
                        toast.success(`Código copiado: ${tenant.slug}`)
                      }}
                    >
                      Copiar código
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guía de roles */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-300">Cómo funcionan los roles</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-zinc-500">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                <Shield size={12} /> Super Admin (tú)
              </div>
              <p>Accedes a <code className="bg-zinc-800 px-1 rounded">/super-admin</code>. Creas ligas, defines el email del admin de cada liga, ves métricas globales. Solo tu correo <strong>{adminEmail}</strong> puede entrar aquí.</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                <Building2 size={12} /> Admin de Liga
              </div>
              <p>El organizador de cada empresa. Se auto-asigna al registrarse si su correo coincide con el <code className="bg-zinc-800 px-1 rounded">email_admin</code> de la liga. Accede a <code className="bg-zinc-800 px-1 rounded">/admin</code>.</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Users size={12} /> Jugador
              </div>
              <p>Todos los demás participantes. Acceden al mercado, su portafolio y el ranking de su liga. No ven el panel de admin.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
