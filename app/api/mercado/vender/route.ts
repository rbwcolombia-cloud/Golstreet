// API Route: Ejecutar venta de partes de un equipo
import { NextRequest, NextResponse } from 'next/server'
import { MarketEngine } from '@/lib/engine/market-engine'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { tenant_id, team_id, acciones, tipo, precio_limite } = body

  if (!tenant_id || !team_id || !acciones || acciones < 1) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const tipoVenta = tipo === 'limite' ? 'venta_limite' : 'venta_mercado'

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', user.id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!portfolio) {
    return NextResponse.json({ error: 'Portafolio no encontrado' }, { status: 404 })
  }

  const engine = new MarketEngine(tenant_id)

  const resultado = tipoVenta === 'venta_limite'
    ? await engine.crearOrdenLimite({
        portfolio_id: portfolio.id,
        tenant_id,
        team_id,
        acciones: parseInt(acciones),
        tipo: tipoVenta,
        precio_limite: parseFloat(precio_limite),
      })
    : await engine.ejecutarVentaMercado({
        portfolio_id: portfolio.id,
        tenant_id,
        team_id,
        acciones: parseInt(acciones),
        tipo: tipoVenta,
      })

  if (!resultado.exitoso) {
    return NextResponse.json({ error: resultado.error }, { status: 400 })
  }

  return NextResponse.json(resultado)
}
