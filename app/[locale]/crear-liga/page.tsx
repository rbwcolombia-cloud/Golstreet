'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LogoGolStreet } from '@/components/ui/logo-golstreet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Building2, Users, Phone, Mail, User,
  ChevronRight, Check, Trophy, Zap, Shield,
  ArrowLeft, MessageCircle
} from 'lucide-react'

const RANGOS_PARTICIPANTES = [
  '5 – 15 personas',
  '15 – 30 personas',
  '30 – 60 personas',
  '60 – 100 personas',
  '100+ personas',
]

const CUANDO = [
  'Quiero empezar ya',
  'Para el Mundial FIFA 2026',
  'Solo estoy explorando',
]

export default function CrearLigaPage() {
  const [form, setForm] = useState({
    nombre_empresa: '',
    nombre_contacto: '',
    email: '',
    whatsapp: '',
    participantes: '',
    cuando: '',
  })
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const set = (campo: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [campo]: e.target.value }))

  const valido =
    form.nombre_empresa.trim().length > 1 &&
    form.nombre_contacto.trim().length > 1 &&
    form.email.includes('@') &&
    form.participantes !== '' &&
    form.cuando !== ''

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valido) return
    setEnviando(true)

    const msg = encodeURIComponent(
      `¡Hola! Quiero crear una liga en GolStreet 🏆\n\n` +
      `*Empresa / grupo:* ${form.nombre_empresa}\n` +
      `*Contacto:* ${form.nombre_contacto}\n` +
      `*Email:* ${form.email}\n` +
      (form.whatsapp ? `*WhatsApp:* ${form.whatsapp}\n` : '') +
      `*Participantes:* ${form.participantes}\n` +
      `*¿Cuándo?:* ${form.cuando}`
    )

    // Abre WhatsApp con el mensaje pre-cargado
    window.open(`https://wa.me/573000000000?text=${msg}`, '_blank')

    setTimeout(() => {
      setEnviando(false)
      setEnviado(true)
    }, 800)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-center mx-auto">
            <Check size={36} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-3">¡Solicitud enviada!</h1>
            <p className="text-muted-foreground leading-relaxed">
              Te abrimos WhatsApp con todos los detalles. Nuestro equipo te contactará en menos de 24 horas para configurar tu liga.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próximos pasos</p>
            {[
              'Confirmamos los detalles de tu liga por WhatsApp',
              'Te enviamos el código único para tus participantes',
              'Tus jugadores se registran con ese código y empiezan a invertir',
            ].map((paso, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-background">{i + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">{paso}</p>
              </div>
            ))}
          </div>
          <Link href="/">
            <Button variant="outline" className="border-border text-muted-foreground cursor-pointer">
              <ArrowLeft size={14} /> Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Nav simple */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <Link href="/">
          <LogoGolStreet size="sm" />
        </Link>
        <Link href="/registro">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-sm cursor-pointer">
            Ya tengo un código <ChevronRight size={13} />
          </Button>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* ── Columna izquierda: beneficios ── */}
        <div className="space-y-8 lg:sticky lg:top-10">
          <div>
            <p className="text-xs font-semibold text-emerald-400 tracking-widest uppercase mb-3">Para empresas, grupos y parches</p>
            <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
              Crea la liga de tu <span className="text-emerald-400">empresa o grupo</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              GolStreet es el Wall Street del Mundial FIFA 2026. Configura un mercado privado para tu equipo, familia o parche — con premios reales que tú defines.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icono: Trophy,
                color: 'text-amber-400 bg-amber-950/40',
                titulo: 'Tú defines los premios',
                desc: 'Bono, regalo, beneficio o los derechos de bravuconería por un año.',
              },
              {
                icono: Zap,
                color: 'text-blue-400 bg-blue-950/40',
                titulo: 'Listo en minutos',
                desc: 'Te enviamos un código único. Tus participantes solo tienen que registrarse con él.',
              },
              {
                icono: Users,
                color: 'text-purple-400 bg-purple-950/40',
                titulo: 'De 5 a 500 jugadores',
                desc: 'Funciona igual para un parche de amigos o toda una empresa.',
              },
              {
                icono: Shield,
                color: 'text-emerald-400 bg-emerald-950/40',
                titulo: 'Sin dinero real en la app',
                desc: 'Monedas virtuales. Sin riesgo legal. Los premios los entrega el organizador directamente.',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icono size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted/10 border border-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cómo funciona</p>
            <ol className="space-y-2.5">
              {[
                'Llenas el formulario → te llamamos',
                'Activamos tu liga con un código único',
                'Compartes el código con tus participantes',
                'Cada uno se registra y empieza a invertir',
                'Al final del Mundial, el ranking decide los premios',
              ].map((paso, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                    {i + 1}
                  </span>
                  {paso}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Columna derecha: formulario ── */}
        <div>
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-7 space-y-5 shadow-xl shadow-black/20">
            <div>
              <h2 className="text-xl font-bold mb-1">Solicitar mi liga</h2>
              <p className="text-xs text-muted-foreground">Te contactamos en menos de 24 horas.</p>
            </div>

            <div className="space-y-4">
              {/* Empresa */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={12} /> Empresa / grupo / parche *
                </Label>
                <Input
                  required
                  placeholder="Ej: Empresa XYZ, Los Amigos del Barrio..."
                  value={form.nombre_empresa}
                  onChange={set('nombre_empresa')}
                  className="bg-background border-border h-11"
                />
              </div>

              {/* Nombre */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} /> Tu nombre *
                </Label>
                <Input
                  required
                  placeholder="Nombre completo"
                  value={form.nombre_contacto}
                  onChange={set('nombre_contacto')}
                  className="bg-background border-border h-11"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={12} /> Email de contacto *
                </Label>
                <Input
                  required
                  type="email"
                  placeholder="tu@empresa.com"
                  value={form.email}
                  onChange={set('email')}
                  className="bg-background border-border h-11"
                />
              </div>

              {/* WhatsApp (opcional) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={12} /> WhatsApp <span className="font-normal normal-case tracking-normal">(opcional, para respuesta rápida)</span>
                </Label>
                <Input
                  type="tel"
                  placeholder="+57 300 000 0000"
                  value={form.whatsapp}
                  onChange={set('whatsapp')}
                  className="bg-background border-border h-11"
                />
              </div>

              {/* Participantes */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={12} /> ¿Cuántos participantes? *
                </Label>
                <select
                  required
                  value={form.participantes}
                  onChange={set('participantes')}
                  className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="" disabled>Selecciona un rango</option>
                  {RANGOS_PARTICIPANTES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Cuándo */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  ¿Cuándo quieres empezar? *
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {CUANDO.map(op => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, cuando: op }))}
                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all cursor-pointer ${
                        form.cuando === op
                          ? 'border-emerald-600/70 bg-emerald-950/30 text-emerald-300'
                          : 'border-border bg-muted/10 text-muted-foreground hover:text-foreground hover:border-border/80'
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!valido || enviando}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-12 text-base gap-2 cursor-pointer disabled:opacity-40"
              style={valido ? { boxShadow: 'var(--gs-glow)' } : undefined}
            >
              <MessageCircle size={16} />
              {enviando ? 'Abriendo WhatsApp...' : 'Solicitar mi liga'}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground/50">
              Al enviar, abrimos WhatsApp con tus datos para que nuestro equipo te contacte.
            </p>
          </form>

          {/* Link jugador */}
          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Te invitaron a una liga?{' '}
              <Link href="/registro" className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2">
                Regístrate aquí con tu código
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
