import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlujo } from './onboarding-flujo'

export default async function PaginaOnboarding() {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Si ya completó el onboarding, ir al mercado
  const { data: perfil } = await supabase
    .from('profiles')
    .select('onboarding_completo, nombre_completo')
    .eq('id', user.id)
    .single()

  if (perfil?.onboarding_completo) redirect('/mercado')

  // Buscar tenants disponibles para unirse (o crear uno)
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, nombre, slug')
    .limit(10)

  return (
    <OnboardingFlujo
      userId={user.id}
      nombreUsuario={perfil?.nombre_completo ?? ''}
      tenants={tenants ?? []}
    />
  )
}
