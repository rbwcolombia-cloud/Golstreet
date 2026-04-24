import { NextRequest, NextResponse } from 'next/server'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { tenant_id, ...campos } = body

  // Verificar que es admin del tenant
  const { data: miembro } = await supabase
    .from('tenant_members')
    .select('rol')
    .eq('tenant_id', tenant_id)
    .eq('user_id', user.id)
    .single()

  if (!miembro || miembro.rol !== 'admin') {
    return NextResponse.json({ error: 'No tienes permisos de administrador' }, { status: 403 })
  }

  const { error } = await supabase
    .from('tenants')
    .update(campos)
    .eq('id', tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
