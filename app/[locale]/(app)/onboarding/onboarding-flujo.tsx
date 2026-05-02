'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoGolStreet } from '@/components/ui/logo-golstreet'
import {
  Coins, TrendingUp, TrendingDown, Trophy,
  ShoppingCart, Zap, Bot, ChevronRight, ChevronLeft,
  Check, CircleDot, Shield, Target, Rocket,
  Flag, Lock, SlidersHorizontal, Bot as BotIcon
} from 'lucide-react'

interface OnboardingFlujoProps {
  userId: string
  nombreUsuario: string
  tenants: Array<{ id: string; nombre: string; slug: string }>
}

type Perfil = 'conservador' | 'moderado' | 'arriesgado' | 'manual'

const PERFILES = [
  {
    id: 'conservador' as Perfil,
    icono: Shield,
    nombre: 'Conservador',
    descripcion: 'Prefieres los favoritos con menor riesgo.',
    detalle: 'El Broker te sugerirá selecciones top-ranked y alertas cuando un favorito baje de precio.',
    colorBorde: 'border-blue-600/60 bg-blue-950/20',
    colorBordeActivo: 'border-blue-500 bg-blue-950/30 shadow-blue-900/30',
    colorIcon: 'text-blue-400 bg-blue-950/50',
    colorBadge: 'text-blue-400 bg-blue-950/40 border-blue-800/60',
  },
  {
    id: 'moderado' as Perfil,
    icono: Target,
    nombre: 'Moderado',
    descripcion: 'Equilibras selecciones seguras con apuestas sorpresa.',
    detalle: 'El Broker te alertará sobre equipos en buen momento y oportunidades de diversificación.',
    colorBorde: 'border-yellow-600/60 bg-yellow-950/20',
    colorBordeActivo: 'border-yellow-500 bg-yellow-950/30 shadow-yellow-900/30',
    colorIcon: 'text-yellow-400 bg-yellow-950/50',
    colorBadge: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/60',
  },
  {
    id: 'arriesgado' as Perfil,
    icono: Rocket,
    nombre: 'Arriesgado',
    descripcion: 'Buscas las sorpresas del torneo. Alto riesgo, alto retorno.',
    detalle: 'El Broker te avisará sobre underdogs con potencial y equipos en racha alcista.',
    colorBorde: 'border-red-600/60 bg-red-950/20',
    colorBordeActivo: 'border-red-500 bg-red-950/30 shadow-red-900/30',
    colorIcon: 'text-red-400 bg-red-950/50',
    colorBadge: 'text-red-400 bg-red-950/40 border-red-800/60',
  },
  {
    id: 'manual' as Perfil,
    icono: SlidersHorizontal,
    nombre: 'Manual',
    descripcion: 'Tú decides todo. Sin recomendaciones automáticas.',
    detalle: 'El Broker estará en silencio. Analizas el mercado y compras lo que quieras sin sugerencias.',
    colorBorde: 'border-zinc-600/60 bg-zinc-900/20',
    colorBordeActivo: 'border-zinc-400 bg-zinc-900/30 shadow-zinc-900/30',
    colorIcon: 'text-zinc-300 bg-zinc-800/50',
    colorBadge: 'text-zinc-400 bg-zinc-800/40 border-zinc-700/60',
  },
]

// ── Partido de práctica ──
interface EventoSimulado {
  tiempo: number
  tipo: 'gol' | 'tarjeta_roja' | 'resultado'
  equipo: 'colombia' | 'japon'
  impacto: number
  mensaje: string
  icono: React.ElementType
  iconoColor: string
}

const EVENTOS_PRACTICA: EventoSimulado[] = [
  { tiempo: 8000,  tipo: 'gol',         equipo: 'colombia', impacto: 8,   mensaje: '¡GOL! Colombia marca',         icono: TrendingUp,   iconoColor: 'text-emerald-400' },
  { tiempo: 20000, tipo: 'tarjeta_roja', equipo: 'colombia', impacto: -18, mensaje: 'Tarjeta roja a Colombia',       icono: TrendingDown, iconoColor: 'text-red-400' },
  { tiempo: 38000, tipo: 'gol',          equipo: 'japon',    impacto: 8,   mensaje: '¡GOL! Japón empata',            icono: TrendingUp,   iconoColor: 'text-emerald-400' },
  { tiempo: 52000, tipo: 'gol',          equipo: 'japon',    impacto: 15,  mensaje: '¡Doblete! Japón anota de nuevo', icono: TrendingUp,  iconoColor: 'text-emerald-400' },
  { tiempo: 60000, tipo: 'resultado',    equipo: 'japon',    impacto: 0,   mensaje: 'Partido terminado',              icono: Flag,        iconoColor: 'text-muted-foreground' },
]

function PartidoPractica({ onTerminar }: { onTerminar: (r: { ganancia: number }) => void }) {
  const [tiempoMs, setTiempoMs]     = useState(0)
  const [precioCol, setPrecioCol]   = useState(850)
  const [precioJpn, setPrecioJpn]   = useState(600)
  const [eventos, setEventos]       = useState<EventoSimulado[]>([])
  const [terminado, setTerminado]   = useState(false)
  const [monedas]                   = useState(10000)
  const [accionesCol]               = useState(3)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const precioInicialCol = 850

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTiempoMs(prev => {
        const nuevo = prev + 200
        const eventoAhora = EVENTOS_PRACTICA.find(e => e.tiempo >= prev && e.tiempo < nuevo)

        if (eventoAhora) {
          setEventos(p => [eventoAhora, ...p].slice(0, 4))
          if (eventoAhora.tipo === 'resultado') {
            clearInterval(intervalRef.current!)
            setTerminado(true)
          } else if (eventoAhora.equipo === 'colombia') {
            setPrecioCol(p => Math.round(p * (1 + eventoAhora.impacto / 100)))
          } else {
            setPrecioJpn(p => Math.round(p * (1 + eventoAhora.impacto / 100)))
          }
        }
        return nuevo
      })
    }, 200)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const minutoSimulado    = Math.min(90, Math.floor(tiempoMs / 667))
  const valorPortafolio   = monedas + accionesCol * precioCol - (3 * precioInicialCol)
  const ganancia          = valorPortafolio

  useEffect(() => {
    if (terminado) setTimeout(() => onTerminar({ ganancia }), 2500)
  }, [terminado, ganancia, onTerminar])

  const pctCol = ((precioCol - precioInicialCol) / precioInicialCol * 100)
  const pctJpn = ((precioJpn - 600) / 600 * 100)

  return (
    <div className="space-y-5">
      {/* Reloj */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-5 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-2xl font-bold tabular-nums">
            {String(Math.floor(minutoSimulado)).padStart(2, '0')}&apos;
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Colombia vs Japón — Partido de Práctica</p>
      </div>

      {/* Marcador */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { pais: 'Colombia', bandera: 'co', precio: precioCol, pct: pctCol },
          { pais: 'Japón',    bandera: 'jp', precio: precioJpn, pct: pctJpn },
        ].map((t) => {
          const positivo = t.pct > 0
          return (
            <div key={t.pais} className="bg-card border border-border rounded-2xl p-4 text-center">
              <img
                src={`https://flagcdn.com/${t.bandera}.svg`}
                alt={t.pais}
                className="w-14 h-9 object-cover rounded-lg mx-auto mb-2 shadow-md"
              />
              <p className="text-sm text-muted-foreground font-medium mb-1">{t.pais}</p>
              <p className={`text-2xl font-mono font-bold tabular-nums ${positivo ? 'text-emerald-400' : 'text-red-400'}`}>
                ${t.precio.toLocaleString('es-CO')}
              </p>
              <p className={`text-xs font-mono mt-0.5 ${positivo ? 'text-emerald-500' : 'text-red-500'}`}>
                {positivo ? '+' : ''}{t.pct.toFixed(1)}%
              </p>
            </div>
          )
        })}
      </div>

      {/* Tu inversión */}
      <div className={`rounded-xl border p-4 text-center ${ganancia >= 0 ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-red-950/20 border-red-900/40'}`}>
        <p className="text-xs text-muted-foreground mb-1">Tu ganancia (3 partes de Colombia)</p>
        <p className={`text-3xl font-mono font-bold tabular-nums ${ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {ganancia >= 0 ? '+' : ''}${ganancia.toLocaleString('es-CO')} coins
        </p>
      </div>

      {/* Feed de eventos */}
      <div className="space-y-1.5 min-h-20">
        {eventos.map((e, i) => {
          const Icono = e.icono
          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-2.5 rounded-xl text-sm transition-opacity ${i === 0 ? 'bg-muted/40 opacity-100' : 'opacity-40'}`}
            >
              <Icono size={15} className={e.iconoColor} aria-hidden="true" />
              <span className="text-foreground/80 flex-1">{e.mensaje}</span>
              {e.impacto !== 0 && (
                <span className={`font-mono font-bold text-xs ${e.impacto > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {e.impacto > 0 ? '+' : ''}{e.impacto}%
                </span>
              )}
            </div>
          )
        })}
      </div>

      {terminado && (
        <div className="text-center bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4">
          <p className="text-emerald-400 font-bold">¡Partido terminado!</p>
          <p className="text-muted-foreground text-sm mt-1">Pasando al mercado real...</p>
        </div>
      )}
    </div>
  )
}

// ── Paso indicator ──
function StepDot({ index, actual, total }: { index: number; actual: number; total: number }) {
  const completado = index < actual
  const activo     = index === actual

  return (
    <div className={`transition-all duration-300 rounded-full flex items-center justify-center ${
      activo     ? 'w-7 h-7 bg-emerald-500 shadow-[0_0_10px_oklch(0.72_0.22_148/40%)]' :
      completado ? 'w-5 h-5 bg-emerald-900/80 border border-emerald-700' :
                   'w-5 h-5 bg-muted/50 border border-border'
    }`}>
      {completado && <Check size={11} className="text-emerald-400" aria-hidden="true" />}
      {activo     && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
    </div>
  )
}

// ── Flujo principal ──
export function OnboardingFlujo({ userId, nombreUsuario, tenants }: OnboardingFlujoProps) {
  const [pantalla, setPantalla]               = useState(0)
  const [perfilElegido, setPerfilElegido]     = useState<Perfil | null>(null)
  const [ligaCodigo, setLigaCodigo]           = useState('')
  const [resultadoPractica, setResultadoPractica] = useState<{ ganancia: number } | null>(null)
  const [cargando, setCargando]               = useState(false)
  const router = useRouter()

  const avanzar    = () => setPantalla(p => p + 1)
  const retroceder = () => setPantalla(p => Math.max(0, p - 1))

  const completarOnboarding = async () => {
    if (!perfilElegido) return toast.error('Elige tu perfil de inversión')
    setCargando(true)
    try {
      const res = await fetch('/api/onboarding/completar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfil_riesgo: perfilElegido, liga_codigo: ligaCodigo }),
      })
      const data = await res.json()
      if (!res.ok) toast.error(data.error ?? 'Error al configurar tu cuenta')
      else router.push('/mercado')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  const TOTAL_PANTALLAS = 8
  const progreso = ((pantalla + 1) / TOTAL_PANTALLAS) * 100

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <LogoGolStreet size="sm" />
        <span className="text-xs text-muted-foreground font-medium tabular-nums">
          {pantalla + 1} / {TOTAL_PANTALLAS}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-0.5 bg-muted/30 w-full">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progreso}%`, boxShadow: 'var(--gs-glow-sm)' }}
        />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* ── Pantalla 0: Bienvenida ── */}
          {pantalla === 0 && (
            <div className="text-center space-y-7">
              <div className="flex justify-center mb-2">
                <LogoGolStreet size="lg" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-3 tracking-tight">
                  Bienvenido{nombreUsuario ? `, ${nombreUsuario.split(' ')[0]}` : ''}
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  El Wall Street del Mundial FIFA 2026.
                  <br />Compra y vende partes de selecciones.
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 text-left space-y-4">
                {[
                  { icono: Coins,     color: 'text-emerald-400', titulo: '$10,000 monedas para empezar', desc: 'Gratis. Sin dinero real.' },
                  { icono: TrendingUp, color: 'text-blue-400',  titulo: 'Precios en vivo con cada gol', desc: 'El mercado respira con el partido.' },
                  { icono: Trophy,    color: 'text-amber-400',   titulo: 'El que más gana, gana el pozo', desc: 'Premios reales según el ranking final.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted/40 ${item.color}`}>
                      <item.icono size={18} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{item.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={avanzar}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-12 text-base gap-2 cursor-pointer"
                style={{ boxShadow: 'var(--gs-glow)' }}
              >
                Empezar
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </div>
          )}

          {/* ── Pantalla 1: Cómo funciona ── */}
          {pantalla === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 tracking-tight">¿Cómo funciona?</h2>
                <p className="text-muted-foreground text-sm">Es como la bolsa de valores, pero para fútbol</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    paso: '1', icono: ShoppingCart, titulo: 'Compras partes de un equipo',
                    desc: 'Cada selección tiene un precio. Compras partes con tus monedas.',
                    ejemplo: 'Compras 5 partes de Colombia a $850 = $4,250 coins',
                    color: 'text-blue-400 bg-blue-950/40',
                  },
                  {
                    paso: '2', icono: Zap, titulo: 'El precio sube y baja en vivo',
                    desc: 'Cada evento del partido mueve el precio al instante.',
                    ejemplo: '¡Gol de Colombia! → Precio sube 8% → $918',
                    color: 'text-yellow-400 bg-yellow-950/40',
                  },
                  {
                    paso: '3', icono: Bot, titulo: 'Vendas cuando quieras',
                    desc: 'Vende en cualquier momento y quédate con la ganancia.',
                    ejemplo: 'Vendes a $918 → ganaste $340 coins en un partido',
                    color: 'text-emerald-400 bg-emerald-950/40',
                  },
                ].map((item) => (
                  <div key={item.paso} className="bg-card border border-border rounded-2xl p-4 flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${item.color}`}>
                      {item.paso}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <item.icono size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
                        <p className="font-semibold text-foreground text-sm">{item.titulo}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                      <div className="bg-muted/30 border border-border/50 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400 truncate">
                        {item.ejemplo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={retroceder} className="border-border text-muted-foreground cursor-pointer">
                  <ChevronLeft size={15} /> Atrás
                </Button>
                <Button onClick={avanzar} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-background font-semibold gap-1.5 cursor-pointer">
                  Entendido <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Pantalla 2: Los 3 Días de Cobro ── */}
          {pantalla === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Los 3 Días de Cobro</h2>
                <p className="text-muted-foreground text-sm">El ranking se mide en 3 momentos clave del torneo</p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    numero: '1', nombre: 'Día de Cobro 1',
                    momento: 'Al cerrar la Fase de Grupos',
                    color: 'border-blue-700/60 bg-blue-950/20',
                    dot: 'bg-blue-500',
                  },
                  {
                    numero: '2', nombre: 'Día de Cobro 2',
                    momento: 'Al cerrar los Cuartos de Final',
                    color: 'border-yellow-700/60 bg-yellow-950/20',
                    dot: 'bg-yellow-500',
                  },
                  {
                    numero: '3', nombre: 'Día de Cobro Final',
                    momento: 'Cuando se define el campeón',
                    color: 'border-emerald-700/60 bg-emerald-950/20',
                    dot: 'bg-emerald-500',
                    esFinal: true,
                  },
                ].map((dc) => (
                  <div key={dc.numero} className={`border rounded-2xl p-4 ${dc.color}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${dc.dot} flex items-center justify-center text-background font-bold text-sm shrink-0`}>
                        {dc.numero}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {dc.nombre}
                          {dc.esFinal && (
                            <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-1.5 py-0.5 rounded-full">
                              Cierre final
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{dc.momento}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/20 border border-border rounded-xl p-4 flex gap-3">
                <Lock size={15} className="text-muted-foreground shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El mercado nunca se detiene en los Días de Cobro. Son solo una <span className="text-foreground">foto del ranking</span>. El Día de Cobro Final sí cierra todo y define los premios reales.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={retroceder} className="border-border text-muted-foreground cursor-pointer">
                  <ChevronLeft size={15} /> Atrás
                </Button>
                <Button onClick={avanzar} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-background font-semibold gap-1.5 cursor-pointer">
                  Siguiente <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Pantalla 3: Tu valor en el torneo ── */}
          {pantalla === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Tu valor crece con el torneo</h2>
                <p className="text-muted-foreground text-sm">Cada partido mueve tu portafolio hacia arriba o hacia abajo</p>
              </div>

              {/* Timeline visual del torneo */}
              <div className="space-y-3">
                {[
                  {
                    fase: 'Fase de Grupos',
                    icono: '🏟️',
                    desc: 'Los equipos que compres suben si ganan, bajan si pierden o les sacan tarjeta roja.',
                    detalle: 'Colombia gana 2-0 → tus partes de Colombia +12%',
                    color: 'border-blue-800/50 bg-blue-950/20',
                    tag: 'bg-blue-900/40 text-blue-300',
                  },
                  {
                    fase: 'Octavos y Cuartos',
                    icono: '⚡',
                    desc: 'El mercado se acelera. Las eliminaciones colapsan el precio del equipo eliminado.',
                    detalle: 'Argentina eliminada → tus partes de Argentina -80%',
                    color: 'border-yellow-800/50 bg-yellow-950/20',
                    tag: 'bg-yellow-900/40 text-yellow-300',
                  },
                  {
                    fase: 'Semifinal y Final',
                    icono: '🏆',
                    desc: 'Los equipos que lleguen lejos valen muchísimo. El campeón puede triplicar su precio.',
                    detalle: 'Tu equipo llega a la final → precio ×3 desde el inicio',
                    color: 'border-emerald-800/50 bg-emerald-950/20',
                    tag: 'bg-emerald-900/40 text-emerald-300',
                  },
                ].map((item) => (
                  <div key={item.fase} className={`border rounded-2xl p-4 ${item.color}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{item.icono}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm mb-1">{item.fase}</p>
                        <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                        <span className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg ${item.tag}`}>
                          Ej: {item.detalle}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/20 border border-border rounded-xl p-4 flex gap-3">
                <TrendingUp size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tu objetivo es terminar el torneo con el <span className="text-foreground font-semibold">mayor valor total</span> — la suma de tus monedas disponibles más el valor actual de tus partes de equipos.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={retroceder} className="border-border text-muted-foreground cursor-pointer">
                  <ChevronLeft size={15} /> Atrás
                </Button>
                <Button onClick={avanzar} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-background font-semibold gap-1.5 cursor-pointer">
                  ¿Y qué gano? <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Pantalla 4: Los Premios ── */}
          {pantalla === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Los Premios 🏆</h2>
                <p className="text-muted-foreground text-sm">
                  Al final del torneo, los mejores inversores se llevan el premio
                </p>
              </div>

              {/* Ranking visual top 5 */}
              <div className="space-y-2.5">
                {[
                  { pos: 1, emoji: '🥇', nombre: 'Primer lugar',   bg: 'bg-yellow-950/40 border-yellow-700/50', color: 'text-yellow-300', badge: 'bg-yellow-900/40 border-yellow-700/60 text-yellow-200', premio: 'El premio más grande — definido por tu liga' },
                  { pos: 2, emoji: '🥈', nombre: 'Segundo lugar',  bg: 'bg-zinc-800/40 border-zinc-600/50',    color: 'text-zinc-200',   badge: 'bg-zinc-800/40 border-zinc-600/60 text-zinc-300',   premio: 'Premio secundario de tu liga' },
                  { pos: 3, emoji: '🥉', nombre: 'Tercer lugar',   bg: 'bg-orange-950/40 border-orange-700/50', color: 'text-orange-300', badge: 'bg-orange-900/40 border-orange-700/60 text-orange-200', premio: 'Premio para el tercer lugar' },
                  { pos: 4, emoji: '4️⃣',  nombre: 'Cuarto lugar',  bg: 'bg-zinc-900/60 border-zinc-800/50',    color: 'text-zinc-400',   badge: 'bg-zinc-900/40 border-zinc-700/40 text-zinc-400',   premio: 'Reconocimiento especial' },
                  { pos: 5, emoji: '5️⃣',  nombre: 'Quinto lugar',  bg: 'bg-zinc-900/60 border-zinc-800/50',    color: 'text-zinc-500',   badge: 'bg-zinc-900/40 border-zinc-700/40 text-zinc-500',   premio: 'Reconocimiento especial' },
                ].map((item) => (
                  <div key={item.pos} className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${item.bg}`}>
                    <span className="text-xl shrink-0">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm ${item.color}`}>{item.nombre}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.premio}</p>
                    </div>
                    <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full shrink-0 ${item.badge}`}>
                      Top {item.pos}
                    </span>
                  </div>
                ))}

                {/* Resto */}
                <div className="flex items-center gap-3 border border-zinc-900/50 rounded-xl px-4 py-2.5 opacity-50">
                  <span className="text-base">👥</span>
                  <p className="text-xs text-muted-foreground">Posiciones 6–20 — sin premio, pero honor eterno</p>
                </div>
              </div>

              {/* Nota sobre premios */}
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 flex gap-3">
                <Trophy size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300 mb-1">Los premios los define tu liga</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tu empresa, parche o familia configura qué gana cada puesto — puede ser un regalo, un bono en dinero, un beneficio especial o simplemente los derechos de bravuconería por un año. 😄
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={retroceder} className="border-border text-muted-foreground cursor-pointer">
                  <ChevronLeft size={15} /> Atrás
                </Button>
                <Button onClick={avanzar} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-background font-semibold gap-1.5 cursor-pointer">
                  ¡Quiero practicar! <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Pantalla 5: Partido de práctica ── */}
          {pantalla === 5 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-1 tracking-tight">Partido de Práctica</h2>
                <p className="text-xs text-muted-foreground">Con monedas ficticias — así funciona el mercado en vivo</p>
              </div>

              {!resultadoPractica ? (
                <PartidoPractica onTerminar={setResultadoPractica} />
              ) : (
                <div className="space-y-5 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-center mx-auto">
                    <Flag size={28} className="text-emerald-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Partido terminado</h3>
                  <div className={`text-4xl font-mono font-bold tabular-nums ${resultadoPractica.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {resultadoPractica.ganancia >= 0 ? '+' : ''}${resultadoPractica.ganancia.toLocaleString('es-CO')} coins
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {resultadoPractica.ganancia >= 0
                      ? 'Bien jugado. Ahora va el torneo real.'
                      : 'El mercado puede ser traicionero. En el torneo real puedes vender antes de que sea tarde.'}
                  </p>
                  <Button
                    onClick={avanzar}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-12 gap-2 cursor-pointer"
                    style={{ boxShadow: 'var(--gs-glow)' }}
                  >
                    Jugar el torneo real <ChevronRight size={15} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Pantalla 6: Elegir perfil ── */}
          {pantalla === 6 && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-2 tracking-tight">¿Cuál es tu estilo?</h2>
                <p className="text-muted-foreground text-sm">
                  Empieces con el estilo que empieces, <strong className="text-foreground">recibirás tus coins completos</strong> para invertir como quieras.
                </p>
              </div>

              {/* Aviso importante */}
              <div className="flex items-start gap-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl px-4 py-3">
                <Bot size={16} className="text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-emerald-300 leading-relaxed">
                  <strong>Tu estilo solo afecta al Broker Personal</strong> — el asistente que te envía alertas y sugerencias. No determina qué equipos tienes ni cuánto inviertes. Tú eliges todo en el mercado.
                </p>
              </div>

              <div className="space-y-2.5">
                {PERFILES.map((p) => {
                  const seleccionado = perfilElegido === p.id
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPerfilElegido(p.id)}
                      className={`w-full text-left border-2 rounded-2xl p-4 transition-all duration-150 cursor-pointer ${
                        seleccionado
                          ? `${p.colorBordeActivo} shadow-xl scale-[1.01]`
                          : `${p.colorBorde} hover:scale-[1.005]`
                      }`}
                      aria-pressed={seleccionado}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.colorIcon}`}>
                          <p.icono size={20} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground">{p.nombre}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.descripcion}</p>
                          {seleccionado && (
                            <p className={`text-xs mt-1.5 leading-relaxed ${p.colorBadge} border rounded-lg px-2 py-1 inline-block`}>
                              🤖 {p.detalle}
                            </p>
                          )}
                        </div>
                        {seleccionado && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <Check size={13} className="text-background" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              <p className="text-[11px] text-muted-foreground/50 text-center">
                Puedes cambiar tu estilo desde el perfil en cualquier momento.
              </p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={retroceder} className="border-border text-muted-foreground cursor-pointer">
                  <ChevronLeft size={15} /> Atrás
                </Button>
                <Button
                  onClick={avanzar}
                  disabled={!perfilElegido}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-background font-semibold gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {perfilElegido ? `Continuar con ${PERFILES.find(p => p.id === perfilElegido)?.nombre}` : 'Elige un estilo'}
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          )}

          {/* ── Pantalla 7: Unirse a liga ── */}
          {pantalla === 7 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-center mx-auto mb-4">
                  <Trophy size={28} className="text-emerald-400" aria-hidden="true" />
                </div>
                <h2 className="text-3xl font-bold mb-2 tracking-tight">¡Casi listo!</h2>
                <p className="text-muted-foreground text-sm">
                  Únete a la liga de tu empresa o grupo.
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 block">
                    Código o slug de tu liga
                  </Label>
                  <Input
                    placeholder="ej: empresa-xyz-2026"
                    value={ligaCodigo}
                    onChange={(e) => setLigaCodigo(e.target.value.toLowerCase().replace(/\s/g, '-'))}
                    className="bg-muted/30 border-border font-mono text-sm h-11"
                  />
                  <p className="text-[11px] text-muted-foreground/60 mt-1.5">El admin de tu liga te dará este código.</p>
                </div>

                {tenants.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground/60 mb-2 font-medium">O elige una liga disponible:</p>
                    <div className="space-y-2">
                      {tenants.slice(0, 3).map(t => (
                        <button
                          key={t.id}
                          onClick={() => setLigaCodigo(t.slug)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all text-sm cursor-pointer ${
                            ligaCodigo === t.slug
                              ? 'border-emerald-600/70 bg-emerald-950/20 text-emerald-300'
                              : 'border-border bg-muted/20 text-muted-foreground hover:border-border/80 hover:text-foreground'
                          }`}
                        >
                          <span className="font-medium">{t.nombre}</span>
                          <span className="text-muted-foreground/50 ml-2 font-mono text-xs">/{t.slug}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resumen portafolio */}
              {perfilElegido && (
                <div className="bg-muted/20 border border-border rounded-xl p-4 flex items-center gap-3">
                  <Coins size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Empiezas con todos tus coins</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Elige los equipos que quieras desde el mercado, sin restricciones.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={retroceder} className="border-border text-muted-foreground cursor-pointer">
                  <ChevronLeft size={15} /> Atrás
                </Button>
                <Button
                  onClick={completarOnboarding}
                  disabled={cargando || !ligaCodigo}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-background font-bold h-12 text-base gap-2 cursor-pointer disabled:opacity-40"
                  style={ligaCodigo ? { boxShadow: 'var(--gs-glow)' } : undefined}
                >
                  {cargando ? (
                    <><CircleDot size={15} className="animate-spin" /> Configurando...</>
                  ) : (
                    <>¡Entrar al mercado! <ChevronRight size={15} /></>
                  )}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Step dots ── */}
      <div className="flex justify-center items-center gap-2.5 pb-8">
        {Array.from({ length: TOTAL_PANTALLAS }).map((_, i) => (
          <StepDot key={i} index={i} actual={pantalla} total={TOTAL_PANTALLAS} />
        ))}
      </div>
    </div>
  )
}
