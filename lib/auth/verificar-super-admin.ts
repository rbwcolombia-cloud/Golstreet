import { createClient } from '@supabase/supabase-js'

/**
 * Verifica si un usuario es super-admin de la plataforma.
 * Fuente primaria: variable de entorno GOLSTREET_ADMIN_EMAIL
 * Fuente secundaria: campo es_super_admin en profiles (para múltiples admins)
 */
export async function esSuperAdmin(userId: string, email: string | undefined): Promise<boolean> {
  const adminEmail = process.env.GOLSTREET_ADMIN_EMAIL?.toLowerCase()
  if (adminEmail && email?.toLowerCase() === adminEmail) return true

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data } = await serviceClient
    .from('profiles')
    .select('es_super_admin')
    .eq('id', userId)
    .single()

  return data?.es_super_admin === true
}
