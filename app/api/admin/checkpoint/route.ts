import { NextRequest, NextResponse } from 'next/server'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { MarketEngine } from '@/lib/engine/market-engine'

export async function POST(request: NextRequest) {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { tenant_id, numero } = await request.json()

  if (![1, 2, 3].includes(numero)) {
    return NextResponse.json({ error: 'Número de checkpoint inválido (debe ser 1, 2 o 3)' }, { status: 400 })
  }

  const { data: miembro } = await supabase
    .from('tenant_members')
    .select('rol')
    .eq('tenant_id', tenant_id)
    .eq('user_id', user.id)
    .single()

  if (!miembro || miembro.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo el admin puede ejecutar checkpoints' }, { status: 403 })
  }

  const engine = new MarketEngine(tenant_id)
  await engine.ejecutarCheckpoint(numero as 1 | 2 | 3)

  return NextResponse.json({ ok: true, mensaje: `Día de Cobro ${numero} ejecutado` })
}
