import { NextRequest, NextResponse } from 'next/server'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Verificar que es el super-admin de la plataforma
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const adminEmail = process.env.GOLSTREET_ADMIN_EMAIL?.toLowerCase()
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { nombre, slug, email_admin, plan, coins_iniciales } = await request.json() as {
    nombre: string
    slug: string
    email_admin: string
    plan: 'gratuito' | 'pro' | 'enterprise'
    coins_iniciales: number
  }

  if (!nombre || !slug || !email_admin) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar que el slug no esté tomado
  const { data: existente } = await serviceClient
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existente) {
    return NextResponse.json({ error: `El código "${slug}" ya está en uso. Elige otro.` }, { status: 409 })
  }

  // Crear el tenant
  const { data: tenant, error } = await serviceClient
    .from('tenants')
    .insert({
      nombre,
      slug,
      email_admin: email_admin.toLowerCase(),
      plan: plan ?? 'pro',
      coins_iniciales: coins_iniciales ?? 10000,
      mercado_activo: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating tenant:', error)
    return NextResponse.json({ error: 'Error al crear la liga' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, tenant: { ...tenant, total_jugadores: 0 } })
}
