import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NavegacionPrincipal } from '@/components/layout/navegacion-principal'
import { PanelAdminCliente } from './panel-admin-cliente'

export default async function PaginaAdmin() {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Solo admins del tenant
  const { data: miembro } = await supabase
    .from('tenant_members')
    .select('tenant_id, rol')
    .eq('user_id', user.id)
    .eq('activo', true)
    .limit(1)
    .single()

  if (!miembro) redirect('/onboarding')
  if (miembro.rol !== 'admin') redirect('/mercado')

  const tenantId = miembro.tenant_id

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  const { data: miembros } = await supabase
    .from('tenant_members')
    .select('*, profiles(nombre_completo), portfolios(saldo_coins, coins_iniciales)')
    .eq('tenant_id', tenantId)
    .eq('activo', true)
    .order('fecha_union')

  const { data: teams } = await supabase
    .from('teams')
    .select('id, nombre, codigo_pais, bandera_url')
    .order('precio_ipo', { ascending: false })

  const { data: checkpoints } = await supabase
    .from('checkpoints')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('numero')

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('saldo_coins')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .single()

  // Cargar invitaciones del tenant (usando service role para bypasear RLS)
  const { createClient } = await import('@supabase/supabase-js')
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: invitaciones } = await adminClient
    .from('invitaciones')
    .select('id, email, nombre, usado, usado_en')
    .eq('tenant_id', tenantId)
    .order('creado_en', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-950">
      <NavegacionPrincipal tenantId={tenantId} saldoCoins={portfolio?.saldo_coins ?? 0} />
      <PanelAdminCliente
        tenant={tenant ?? {}}
        miembros={miembros ?? []}
        teams={teams ?? []}
        checkpoints={checkpoints ?? []}
        invitaciones={invitaciones ?? []}
      />
    </div>
  )
}
