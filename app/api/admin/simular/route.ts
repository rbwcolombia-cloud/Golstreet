// ============================================================
// GolStreet — Disparar simulación manual desde panel admin
// POST /api/admin/simular  { tenant_id }
// Solo el admin del tenant puede activarlo
// ============================================================
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

  // Verificar que el tenant tiene modo_simulacion activo
  const { data: tenant } = await supabase
    .from('tenants')
    .select('modo_simulacion, mercado_activo')
    .eq('id', tenant_id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
  if (!tenant.modo_simulacion) {
    return NextResponse.json({ error: 'El modo simulación no está activado para esta liga' }, { status: 400 })
  }
  if (!tenant.mercado_activo) {
    return NextResponse.json({ error: 'El mercado está cerrado' }, { status: 400 })
  }

  // Llamar internamente al endpoint de simulación con el CRON_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${request.headers.get('host')}`
  const resp = await fetch(`${baseUrl}/api/partidos/simular`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })

  if (!resp.ok) {
    const err = await resp.text()
    return NextResponse.json({ error: `Error en simulación: ${err}` }, { status: 500 })
  }

  const resultado = await resp.json()
  return NextResponse.json({ ok: true, ...resultado })
}
