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

  // Usar service role para buscar el tenant (el usuario aún no es miembro)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar el tenant por slug
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, coins_iniciales, mercado_activo')
    .eq('slug', liga_codigo)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Liga no encontrada. Verifica el código.' }, { status: 404 })
  if (!tenant.mercado_activo) return NextResponse.json({ error: 'Esta liga ya no acepta nuevos jugadores.' }, { status: 400 })

  // Verificar si ya es miembro
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

  // Registrar como miembro del tenant
  await admin.from('tenant_members').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    rol: 'jugador',
    activo: true,
  })

  // Crear portafolio con perfil elegido usando el MarketEngine
  const coinsIniciales = (tenant.coins_iniciales as number) ?? 10000
  const engine = new MarketEngine(tenant.id)
  await engine.crearPortfolioInicial(user.id, perfil_riesgo, coinsIniciales)

  // Marcar onboarding completo
  await admin.from('profiles').update({ onboarding_completo: true }).eq('id', user.id)

  return NextResponse.json({ ok: true, tenant_id: tenant.id })
}
