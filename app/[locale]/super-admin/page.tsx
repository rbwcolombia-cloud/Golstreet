import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { SuperAdminCliente } from './super-admin-cliente'

/** Solo el correo definido en GOLSTREET_ADMIN_EMAIL puede acceder */
export default async function PaginaSuperAdmin() {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminEmail = process.env.GOLSTREET_ADMIN_EMAIL?.toLowerCase()
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
    redirect('/mercado') // Silenciosamente redirige — no revela que la página existe
  }

  // Cargar todos los tenants con sus stats
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tenants } = await serviceClient
    .from('tenants')
    .select(`
      id, nombre, slug, email_admin, plan, mercado_activo,
      modo_acceso, inscripciones_abiertas, coins_iniciales, fecha_creacion
    `)
    .order('fecha_creacion', { ascending: false })

  // Para cada tenant, contar miembros
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
      adminEmail={adminEmail}
      tenants={tenantsConStats}
    />
  )
}
