import { NextRequest, NextResponse } from 'next/server'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { MarketEngine } from '@/lib/engine/market-engine'

export async function POST(request: NextRequest) {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { tenant_id } = await request.json()

  const { data: miembro } = await supabase
    .from('tenant_members')
    .select('rol')
    .eq('tenant_id', tenant_id)
    .eq('user_id', user.id)
    .single()

  if (!miembro || miembro.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo el admin puede inicializar el mercado' }, { status: 403 })
  }

  const engine = new MarketEngine(tenant_id)
  await engine.inicializarMercado()

  return NextResponse.json({ ok: true, mensaje: 'Mercado inicializado con todos los equipos' })
}
