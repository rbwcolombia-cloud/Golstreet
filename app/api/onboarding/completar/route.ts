import { NextRequest, NextResponse } from 'next/server'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { MarketEngine } from '@/lib/engine/market-engine'

export async function POST(request: NextRequest) {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { perfil_riesgo, liga_codigo } = await request.json() as {
    perfil_riesgo: 'conservador' | 'moderado' | 'arriesgado' | 'manual'
    liga_codigo: string
  }

  if (!liga_codigo) return NextResponse.json({ error: 'Necesitas un código de liga' }, { status: 400 })

  // Usar service role para toda la operación
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Buscar el tenant por slug (incluir email_admin para auto-asignar rol)
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, coins_iniciales, mercado_activo, modo_acceso, inscripciones_abiertas, max_jugadores, email_admin')
    .eq('slug', liga_codigo)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Liga no encontrada. Verifica el código.' }, { status: 404 })
  }

  if (!tenant.mercado_activo) {
    return NextResponse.json({ error: 'Esta liga ya no acepta nuevos jugadores.' }, { status: 400 })
  }

  // 2. Verificar si las inscripciones están abiertas
  if (tenant.inscripciones_abiertas === false) {
    return NextResponse.json({
      error: 'Las inscripciones de esta liga están cerradas. Contacta al organizador.',
    }, { status: 403 })
  }

  // 3. Verificar si ya es miembro
  const { data: miembroExistente } = await admin
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .single()

  if (miembroExistente) {
    await admin.from('profiles').update({ onboarding_completo: true }).eq('id', user.id)
    return NextResponse.json({ ok: true })
  }

  // 4. Verificar límite de jugadores (si aplica)
  if (tenant.max_jugadores) {
    const { count } = await admin
      .from('tenant_members')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)

    if (count !== null && count >= tenant.max_jugadores) {
      return NextResponse.json({
        error: `Esta liga ya alcanzó el límite de ${tenant.max_jugadores} jugadores.`,
      }, { status: 403 })
    }
  }

  // 5. Verificar invitación si la liga está en modo invitacion
  if (tenant.modo_acceso === 'invitacion') {
    const emailUsuario = user.email?.toLowerCase() ?? ''

    const { data: invitacion } = await admin
      .from('invitaciones')
      .select('id, usado')
      .eq('tenant_id', tenant.id)
      .eq('email', emailUsuario)
      .single()

    if (!invitacion) {
      return NextResponse.json({
        error: 'Tu correo no está en la lista de invitados de esta liga. Pídele al organizador que te agregue.',
      }, { status: 403 })
    }

    // Marcar la invitación como usada
    await admin
      .from('invitaciones')
      .update({ usado: true, usado_por: user.id, usado_en: new Date().toISOString() })
      .eq('id', invitacion.id)
  }

  // 6. Determinar el rol: admin si el email coincide con email_admin del tenant
  const emailUsuario = user.email?.toLowerCase() ?? ''
  const esAdminLiga = tenant.email_admin?.toLowerCase() === emailUsuario

  // 6. Registrar como miembro del tenant con el rol correcto
  await admin.from('tenant_members').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    rol: esAdminLiga ? 'admin' : 'jugador',
    activo: true,
  })

  // 7. Crear portafolio con perfil elegido usando el MarketEngine
  const coinsIniciales = (tenant.coins_iniciales as number) ?? 10000
  const engine = new MarketEngine(tenant.id)
  await engine.crearPortfolioInicial(user.id, perfil_riesgo, coinsIniciales)

  // 8. Marcar onboarding completo
  await admin.from('profiles').update({ onboarding_completo: true }).eq('id', user.id)

  return NextResponse.json({ ok: true, tenant_id: tenant.id, rol: esAdminLiga ? 'admin' : 'jugador' })
}
