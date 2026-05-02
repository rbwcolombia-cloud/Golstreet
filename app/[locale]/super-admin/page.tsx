import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { SuperAdminCliente } from './super-admin-cliente'

export default async function PaginaSuperAdmin() {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar super admin por campo en DB (más confiable que env var en Vercel)
  // También acepta el env var como fallback
  const adminEmail = process.env.GOLSTREET_ADMIN_EMAIL?.toLowerCase()
  const esPorEnv = adminEmail && user.email?.toLowerCase() === adminEmail

  let esSuperAdmin = esPorEnv

  if (!esSuperAdmin) {
    const { data: perfil } = await serviceClient
      .from('profiles')
      .select('es_super_admin')
      .eq('id', user.id)
      .single()
    esSuperAdmin = perfil?.es_super_admin === true
  }

  if (!esSuperAdmin) redirect('/mercado')

  // Cargar todos los tenants con sus stats
  const { data: tenants } = await serviceClient
    .from('tenants')
    .select(`
      id, nombre, slug, email_admin, plan, mercado_activo,
      modo_acceso, inscripciones_abiertas, coins_iniciales, fecha_creacion
    `)
    .order('fecha_creacion', { ascending: false })

  const tenantsConStats = await Promise.all(
    (tenants ?? []).map(async (t) => {
      const { count: totalJugadores } = await serviceClient
        .from('tenant_members')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', t.id)

      return { ...t, total_jugadores: totalJugadores ?? 0 }
    })
  )

  return (
    <SuperAdminCliente
      adminEmail={user.email ?? ''}
      tenants={tenantsConStats}
    />
  )
}
