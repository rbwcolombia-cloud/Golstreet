'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import type { LeagueAsset, Team, Holding } from '@/types'

interface PanelTradeProps {
  asset: LeagueAsset & { team: Team }
  tenantId: string
  saldoCoins: number
  holding?: Holding
  onTrade?: () => void
}

export function PanelTrade({ asset, tenantId, saldoCoins, holding, onTrade }: PanelTradeProps) {
  const [acciones, setAcciones] = useState('')
  const [precioLimite, setPrecioLimite] = useState('')
  const [cargando, setCargando] = useState(false)

  const accionesNum = parseInt(acciones) || 0
  const costoCompra = accionesNum * asset.precio_actual
  const comisionCompra = costoCompra * 0.02
  const totalCompra = costoCompra + comisionCompra

  const totalVenta = accionesNum * asset.precio_actual * 0.98

  const ejecutarCompra = async () => {
    if (accionesNum < 1) return toast.error('Ingresa cuántas partes quieres comprar')
    if (totalCompra > saldoCoins) return toast.error('No tienes suficientes monedas')

    setCargando(true)
    try {
      const res = await fetch('/api/mercado/comprar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, team_id: asset.team_id, acciones: accionesNum }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Error al comprar')
      } else {
        toast.success(`✅ Compraste ${accionesNum} partes de ${asset.team.nombre} por $${totalCompra.toFixed(0)}`)
        setAcciones('')
        onTrade?.()
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  const ejecutarVenta = async (tipo: 'mercado' | 'limite') => {
    if (accionesNum < 1) return toast.error('Ingresa cuántas partes quieres vender')
    if (!holding || holding.acciones < accionesNum) return toast.error('No tienes suficientes partes')
    if (tipo === 'limite' && !precioLimite) return toast.error('Ingresa el precio mínimo')

    setCargando(true)
    try {
      const res = await fetch('/api/mercado/vender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          team_id: asset.team_id,
          acciones: accionesNum,
          tipo,
          precio_limite: precioLimite,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Error al vender')
      } else {
        if (tipo === 'limite') {
          toast.success(`📋 Orden con precio mínimo creada a $${precioLimite}`)
        } else {
          toast.success(`✅ Vendiste ${accionesNum} partes por $${totalVenta.toFixed(0)}`)
        }
        setAcciones('')
        onTrade?.()
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  if (asset.team.eliminado) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 text-center">
        <p className="text-zinc-400 font-semibold">Equipo eliminado</p>
        <p className="text-zinc-600 text-sm mt-1">El mercado está cerrado para este equipo.</p>
      </div>
    )
  }

  if (asset.mercado_pausado) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-yellow-800/50 p-6 text-center">
        <p className="text-yellow-400 font-semibold">⏸ Mercado pausado</p>
        <p className="text-zinc-500 text-sm mt-1">El mercado se reactiva cuando empieza el partido.</p>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-zinc-500">Precio actual</p>
          <p className="text-2xl font-mono font-bold text-zinc-100">
            ${asset.precio_actual.toLocaleString('es-CO')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Tus monedas</p>
          <p className="text-lg font-mono font-semibold text-emerald-400">
            ${saldoCoins.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <Tabs defaultValue="comprar">
        <TabsList className="w-full bg-zinc-800">
          <TabsTrigger value="comprar" className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Comprar
          </TabsTrigger>
          <TabsTrigger value="vender" className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white"
            disabled={!holding || holding.acciones === 0}
          >
            Vender {holding ? `(${holding.acciones})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comprar" className="space-y-4 mt-4">
          <div>
            <Label className="text-zinc-400 text-sm">Número de partes</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ej: 10"
              value={acciones}
              onChange={(e) => setAcciones(e.target.value)}
              className="bg-zinc-800 border-zinc-700 mt-1 font-mono"
            />
          </div>

          {accionesNum > 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1 text-sm font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>${costoCompra.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Comisión (2%)</span>
                <span>${comisionCompra.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
              </div>
              <Separator className="bg-zinc-700 my-1" />
              <div className="flex justify-between text-zinc-100 font-bold">
                <span>Total</span>
                <span>${totalCompra.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
              </div>
              {totalCompra > saldoCoins && (
                <p className="text-red-400 text-xs">Monedas insuficientes</p>
              )}
            </div>
          )}

          <Button
            onClick={ejecutarCompra}
            disabled={cargando || accionesNum < 1 || totalCompra > saldoCoins}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            {cargando ? 'Comprando...' : `Comprar ${accionesNum || ''} partes`}
          </Button>
        </TabsContent>

        <TabsContent value="vender" className="space-y-4 mt-4">
          <div>
            <Label className="text-zinc-400 text-sm">Número de partes</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                min="1"
                max={holding?.acciones}
                placeholder="Ej: 5"
                value={acciones}
                onChange={(e) => setAcciones(e.target.value)}
                className="bg-zinc-800 border-zinc-700 font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 text-zinc-400 whitespace-nowrap"
                onClick={() => setAcciones(String(holding?.acciones ?? 0))}
              >
                Todo
              </Button>
            </div>
          </div>

          {accionesNum > 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-3 space-y-1 text-sm font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Recibirías</span>
                <span>${totalVenta.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Compraste a</span>
                <span>${holding?.precio_promedio_compra.toLocaleString('es-CO', { maximumFractionDigits: 0 }) ?? '-'}</span>
              </div>
              {holding && (
                <div className={`flex justify-between font-bold ${
                  totalVenta > accionesNum * holding.precio_promedio_compra ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  <span>{totalVenta > accionesNum * holding.precio_promedio_compra ? 'Ganancia' : 'Pérdida'}</span>
                  <span>
                    {totalVenta > accionesNum * holding.precio_promedio_compra ? '+' : ''}
                    ${(totalVenta - accionesNum * holding.precio_promedio_compra).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={() => ejecutarVenta('mercado')}
              disabled={cargando || accionesNum < 1}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold"
            >
              {cargando ? 'Vendiendo...' : 'Vender al mercado ahora'}
            </Button>

            <div>
              <Label className="text-zinc-500 text-xs">Vender con precio mínimo</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  placeholder={`Mínimo $${asset.precio_actual}`}
                  value={precioLimite}
                  onChange={(e) => setPrecioLimite(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => ejecutarVenta('limite')}
                  disabled={cargando || accionesNum < 1 || !precioLimite}
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 whitespace-nowrap"
                >
                  Crear orden
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
