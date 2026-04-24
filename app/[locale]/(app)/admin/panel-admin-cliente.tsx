'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PanelAdminClienteProps {
  tenant: Record<string, unknown>
  miembros: Array<Record<string, unknown>>
  teams: Array<{ id: string; nombre: string; codigo_pais: string; bandera_url: string }>
  checkpoints: Array<Record<string, unknown>>
}

export function PanelAdminCliente({ tenant, miembros, teams, checkpoints }: PanelAdminClienteProps) {
  const [cargando, setCargando] = useState(false)

  // Config liga
  const [nombreLiga, setNombreLiga] = useState(String(tenant.nombre ?? ''))
  const [pozoMonto, setPozoMonto] = useState(String(tenant.pozo_monto ?? '0'))
  const [pantallActiva, setPantallActiva] = useState(Boolean(tenant.pantalla_publica_activa))
  const [modoPantalla, setModoPantalla] = useState(String(tenant.modo_pantalla ?? 'mercado'))
  const [coinsIniciales, setCoinsIniciales] = useState(String(tenant.coins_iniciales ?? '10000'))

  // Distribución del pozo
  const [distribucion, setDistribucion] = useState<Array<{ posicion?: number; porcentaje: number; fondo_liga?: boolean }>>(
    (tenant.pozo_distribucion as Array<{ posicion?: number; porcentaje: number; fondo_liga?: boolean }>) ?? [
      { posicion: 1, porcentaje: 45 },
      { posicion: 2, porcentaje: 25 },
      { posicion: 3, porcentaje: 15 },
      { posicion: 4, porcentaje: 5 },
      { fondo_liga: true, porcentaje: 10 },
    ]
  )

  // Entrada tardía
  const entradaTardia = (tenant.entrada_tardia as Record<string, number | null>) ?? {}
  const [antesOctavos, setAntesOctavos] = useState(String(entradaTardia.antes_octavos ?? 7000))
  const [antesCuartos, setAntesCuartos] = useState(String(entradaTardia.antes_cuartos ?? 5000))

  // Evento manual
  const [eventoTeam, setEventoTeam] = useState('')
  const [eventoTipo, setEventoTipo] = useState('gol')
  const [eventoDesc, setEventoDesc] = useState('')
  const [eventoJugador, setEventoJugador] = useState('')

  const guardarConfigLiga = async () => {
    setCargando(true)
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenant.id,
        nombre: nombreLiga,
        pozo_monto: parseFloat(pozoMonto),
        pozo_distribucion: distribucion,
        pantalla_publica_activa: pantallActiva,
        modo_pantalla: modoPantalla,
        coins_iniciales: parseFloat(coinsIniciales),
        entrada_tardia: {
          antes_octavos: parseInt(antesOctavos),
          antes_cuartos: parseInt(antesCuartos),
          semis_adelante: null,
        },
      }),
    })
    const data = await res.json()
    if (res.ok) toast.success('Configuración guardada')
    else toast.error(data.error ?? 'Error al guardar')
    setCargando(false)
  }

  const inicializarMercado = async () => {
    setCargando(true)
    const res = await fetch('/api/admin/inicializar-mercado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenant.id }),
    })
    const data = await res.json()
    if (res.ok) toast.success('Mercado inicializado con todos los equipos')
    else toast.error(data.error ?? 'Error al inicializar')
    setCargando(false)
  }

  const ejecutarCheckpoint = async (numero: number) => {
    if (!confirm(`¿Ejecutar Día de Cobro ${numero}? Esta acción toma una foto del ranking actual.`)) return
    setCargando(true)
    const res = await fetch('/api/admin/checkpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenant.id, numero }),
    })
    const data = await res.json()
    if (res.ok) toast.success(`Día de Cobro ${numero} ejecutado`)
    else toast.error(data.error ?? 'Error')
    setCargando(false)
  }

  const dispararEvento = async () => {
    if (!eventoTeam) return toast.error('Selecciona un equipo')
    setCargando(true)
    const res = await fetch('/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': '' },
      body: JSON.stringify({
        tenant_id: tenant.id,
        team_id: eventoTeam,
        tipo_evento: eventoTipo,
        descripcion: eventoDesc || undefined,
        jugador_nombre: eventoJugador || undefined,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Evento ${eventoTipo} aplicado al equipo`)
      setEventoDesc('')
      setEventoJugador('')
    } else {
      toast.error(data.error ?? 'Error al aplicar evento')
    }
    setCargando(false)
  }

  const actualizarDistribucion = (idx: number, valor: number) => {
    setDistribucion(prev => prev.map((d, i) => i === idx ? { ...d, porcentaje: valor } : d))
  }

  const totalDistribucion = distribucion.reduce((s, d) => s + d.porcentaje, 0)
  const pozoNum = parseFloat(pozoMonto) || 0

  const TIPOS_EVENTO = [
    { valor: 'gol', etiqueta: '⚽ Gol (+8%)' },
    { valor: 'doblete', etiqueta: '⚽⚽ Doblete (+15%)' },
    { valor: 'hat_trick', etiqueta: '🎩 Hat-trick (+30%)' },
    { valor: 'tarjeta_roja', etiqueta: '🟥 Tarjeta roja (-18%)' },
    { valor: 'tarjeta_roja_figura', etiqueta: '🟥⭐ Figura expulsada (-28%)' },
    { valor: 'lesion_titular', etiqueta: '🏥 Lesión titular (-10%)' },
    { valor: 'atajada_penalti', etiqueta: '🧤 Ataja penalti (+12%)' },
    { valor: 'goleada', etiqueta: '💥 Goleada 0-3 (-35%)' },
    { valor: 'clasificacion', etiqueta: '🏆 Clasifica de ronda (+5%)' },
    { valor: 'eliminacion', etiqueta: '❌ Eliminación (liquidación)' },
  ]

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Panel de administración</h1>
        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">Admin</Badge>
      </div>

      <Tabs defaultValue="liga">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
          <TabsTrigger value="liga" className="data-[state=active]:bg-zinc-800">Liga</TabsTrigger>
          <TabsTrigger value="pozo" className="data-[state=active]:bg-zinc-800">Pozo</TabsTrigger>
          <TabsTrigger value="mercado" className="data-[state=active]:bg-zinc-800">Mercado</TabsTrigger>
          <TabsTrigger value="eventos" className="data-[state=active]:bg-zinc-800">Eventos</TabsTrigger>
          <TabsTrigger value="miembros" className="data-[state=active]:bg-zinc-800">Jugadores</TabsTrigger>
        </TabsList>

        {/* ——— Configuración de la liga ——— */}
        <TabsContent value="liga" className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-200 text-base">Información de la liga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-sm">Nombre de la liga</Label>
                  <Input
                    value={nombreLiga}
                    onChange={(e) => setNombreLiga(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400 text-sm">URL pública</Label>
                  <div className="flex items-center mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-500">
                    /live/<span className="text-zinc-300">{String(tenant.slug)}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-zinc-400 text-sm">Monedas iniciales por jugador</Label>
                <Input
                  type="number"
                  value={coinsIniciales}
                  onChange={(e) => setCoinsIniciales(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 mt-1 w-40 font-mono"
                />
              </div>

              <Separator className="bg-zinc-800" />

              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-300">Pantalla pública</p>
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-400">Pantalla activada</Label>
                  <Switch checked={pantallActiva} onCheckedChange={setPantallActiva} />
                </div>
                <div>
                  <Label className="text-zinc-400 text-sm">Modo de pantalla</Label>
                  <Select value={modoPantalla} onValueChange={(v) => v && setModoPantalla(v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1 w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="mercado">Mercado</SelectItem>
                      <SelectItem value="partido">Partido en vivo</SelectItem>
                      <SelectItem value="ranking">Ranking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-zinc-800" />

              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-300">Entrada tardía al torneo</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-400 text-xs">Antes de Octavos</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-zinc-500 text-sm">$</span>
                      <Input
                        type="number"
                        value={antesOctavos}
                        onChange={(e) => setAntesOctavos(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs">Antes de Cuartos</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-zinc-500 text-sm">$</span>
                      <Input
                        type="number"
                        value={antesCuartos}
                        onChange={(e) => setAntesCuartos(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 font-mono"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-600">En Semis y después, la entrada está bloqueada por defecto.</p>
              </div>

              <Button
                onClick={guardarConfigLiga}
                disabled={cargando}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {cargando ? 'Guardando...' : 'Guardar configuración'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— Pozo de premios ——— */}
        <TabsContent value="pozo" className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-200 text-base">Pozo de premios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-zinc-400 text-sm">Monto total del pozo (solo informativo)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-zinc-400 font-semibold">$</span>
                  <Input
                    type="number"
                    value={pozoMonto}
                    onChange={(e) => setPozoMonto(e.target.value)}
                    placeholder="Ej: 500000"
                    className="bg-zinc-800 border-zinc-700 font-mono w-48"
                  />
                </div>
                <p className="text-xs text-zinc-600 mt-1">GolStreet no procesa este dinero. Es solo para calcular y mostrar los premios estimados.</p>
              </div>

              <Separator className="bg-zinc-800" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-zinc-300">Distribución de premios</p>
                  <span className={`text-sm font-mono ${totalDistribucion === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Total: {totalDistribucion}%
                  </span>
                </div>
                <div className="space-y-3">
                  {distribucion.map((dist, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-zinc-400 text-sm w-28">
                        {dist.fondo_liga ? 'Fondo de liga' : `${dist.posicion}° lugar`}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={dist.porcentaje}
                          onChange={(e) => actualizarDistribucion(i, parseInt(e.target.value) || 0)}
                          className="bg-zinc-800 border-zinc-700 font-mono w-20"
                        />
                        <span className="text-zinc-500">%</span>
                        {pozoNum > 0 && (
                          <span className="text-zinc-400 text-sm font-mono ml-2">
                            = ${((pozoNum * dist.porcentaje) / 100).toLocaleString('es-CO')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {totalDistribucion !== 100 && (
                  <p className="text-red-400 text-xs mt-2">Los porcentajes deben sumar exactamente 100%</p>
                )}
              </div>

              <Button
                onClick={guardarConfigLiga}
                disabled={cargando || totalDistribucion !== 100}
                className="bg-emerald-600 hover:bg-emerald-500"
              >
                {cargando ? 'Guardando...' : 'Guardar distribución'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— Control del mercado ——— */}
        <TabsContent value="mercado" className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-200 text-base">Inicialización del mercado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-400">
                Si el mercado aún no está creado, este botón crea los precios iniciales para los 10 equipos del torneo en tu liga.
              </p>
              <Button onClick={inicializarMercado} disabled={cargando} className="bg-blue-600 hover:bg-blue-500">
                {cargando ? 'Inicializando...' : 'Inicializar mercado con todos los equipos'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-200 text-base">Días de Cobro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-400 mb-4">
                Ejecutar un Día de Cobro toma una foto del ranking en este momento. El mercado sigue activo.
                Solo el Día de Cobro 3 cierra el mercado definitivamente.
              </p>
              {[1, 2, 3].map((numero) => {
                const cp = checkpoints.find(c => (c as Record<string, unknown>).numero === numero)
                const ejecutado = Boolean((cp as Record<string, unknown> | undefined)?.ejecutado)
                return (
                  <div key={numero} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="font-semibold text-zinc-200">Día de Cobro {numero}</p>
                      <p className="text-xs text-zinc-500">
                        {numero === 1 ? 'Cierre de Fase de Grupos' : numero === 2 ? 'Cierre de Cuartos de Final' : 'Campeón definido — cierra el mercado'}
                      </p>
                      {ejecutado && (
                        <p className="text-xs text-emerald-400 mt-0.5">
                          ✓ Ejecutado el {new Date(String((cp as Record<string, unknown>).fecha_ejecucion)).toLocaleDateString('es-CO')}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={ejecutado ? 'outline' : 'default'}
                      disabled={cargando || ejecutado}
                      onClick={() => ejecutarCheckpoint(numero)}
                      className={ejecutado ? 'border-zinc-700 text-zinc-600' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}
                    >
                      {ejecutado ? 'Ejecutado' : numero === 3 ? 'Cerrar torneo' : 'Ejecutar'}
                    </Button>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— Eventos en vivo manuales ——— */}
        <TabsContent value="eventos" className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-200 text-base">Disparar evento en vivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-400">
                Usa esto para aplicar eventos manualmente cuando no tienes integración automática con API-Football.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-sm">Equipo</Label>
                  <Select value={eventoTeam} onValueChange={(v) => v && setEventoTeam(v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                      <SelectValue placeholder="Seleccionar equipo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {teams.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="flex items-center gap-2">
                            <img src={t.bandera_url} alt="" className="w-5 h-3.5 object-cover rounded-sm" />
                            {t.nombre}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-400 text-sm">Tipo de evento</Label>
                  <Select value={eventoTipo} onValueChange={(v) => v && setEventoTipo(v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {TIPOS_EVENTO.map(e => (
                        <SelectItem key={e.valor} value={e.valor}>{e.etiqueta}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400 text-sm">Jugador (opcional)</Label>
                  <Input
                    placeholder="Ej: James Rodríguez"
                    value={eventoJugador}
                    onChange={(e) => setEventoJugador(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400 text-sm">Descripción (opcional)</Label>
                  <Input
                    placeholder="Ej: Gol min 67'"
                    value={eventoDesc}
                    onChange={(e) => setEventoDesc(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={dispararEvento}
                disabled={cargando || !eventoTeam}
                className="bg-orange-600 hover:bg-orange-500 text-white"
              >
                {cargando ? 'Aplicando evento...' : 'Aplicar evento al mercado'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ——— Jugadores ——— */}
        <TabsContent value="miembros">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-200 text-base">
                Jugadores de la liga ({miembros.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {miembros.map((m, i) => {
                  const perfil = m.profiles as Record<string, unknown> | null
                  const portfolio = m.portfolios as Record<string, unknown>[] | null
                  const coins = portfolio?.[0]?.saldo_coins as number ?? 0
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                      <div>
                        <p className="text-zinc-200 font-medium">
                          {String(perfil?.nombre_completo ?? 'Sin nombre')}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-xs mt-0.5 ${m.rol === 'admin' ? 'border-yellow-800 text-yellow-400' : 'border-zinc-700 text-zinc-500'}`}
                        >
                          {String(m.rol)}
                        </Badge>
                      </div>
                      <div className="text-right font-mono">
                        <p className="text-zinc-300 text-sm">${coins.toLocaleString('es-CO')} coins</p>
                        <p className="text-zinc-600 text-xs">
                          Desde {new Date(String(m.fecha_union)).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
