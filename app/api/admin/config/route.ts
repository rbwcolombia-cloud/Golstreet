import { NextRequest, NextResponse } from 'next/server'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { tenant_id } = body

  if (!tenant_id) return NextResponse.json({ error: 'Falta tenant_id' }, { status: 400 })

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

  // Whitelist estricta — el admin de liga NO puede cambiar plan, email_admin ni coins_iniciales
  const CAMPOS_PERMITIDOS = [
    'nombre', 'modo_pantalla', 'pantalla_publica_activa',
    'modo_acceso', 'inscripciones_abiertas', 'mercado_activo',
  ] as const
  type CampoPermitido = typeof CAMPOS_PERMITIDOS[number]

  const campos = Object.fromEntries(
    Object.entries(body).filter(([k]) => (CAMPOS_PERMITIDOS as readonly string[]).includes(k))
  ) as Partial<Record<CampoPermitido, unknown>>

  if (Object.keys(campos).length === 0) {
    return NextResponse.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 })
  }

  const { error } = await supabase
    .from('tenants')
    .update(campos)
    .eq('id', tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
