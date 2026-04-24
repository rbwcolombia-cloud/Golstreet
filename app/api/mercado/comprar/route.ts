// API Route: Ejecutar compra de partes de un equipo
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
  const { tenant_id, team_id, acciones } = body

  if (!tenant_id || !team_id || !acciones || acciones < 1) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  // Verificar que el usuario es miembro del tenant
  const { data: miembro } = await supabase
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('user_id', user.id)
    .single()

  if (!miembro) {
    return NextResponse.json({ error: 'No eres miembro de esta liga' }, { status: 403 })
  }

  // Obtener el portfolio del usuario en este tenant
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
  const resultado = await engine.ejecutarCompra({
    portfolio_id: portfolio.id,
    tenant_id,
    team_id,
    acciones: parseInt(acciones),
    tipo: 'compra',
  })

  if (!resultado.exitoso) {
    return NextResponse.json({ error: resultado.error }, { status: 400 })
  }

  return NextResponse.json(resultado)
}
