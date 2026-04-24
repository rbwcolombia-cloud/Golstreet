// Pantalla pública sin login — optimizada para televisores
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PantallaPublicaCliente } from './pantalla-publica-cliente'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PantallaPublica({ params }: Props) {
  const { slug } = await params
  const supabase = await crearClienteSupabaseServidor()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, nombre, pantalla_publica_activa, modo_pantalla, mercado_activo')
    .eq('slug', slug)
    .single()

  if (!tenant) notFound()

  if (!tenant.pantalla_publica_activa) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl font-black text-zinc-800 mb-4">📺</p>
          <p className="text-xl text-zinc-600">Pantalla pública desactivada</p>
          <p className="text-sm text-zinc-700 mt-2">{tenant.nombre}</p>
        </div>
      </div>
    )
  }

  const { data: assets } = await supabase
    .from('league_assets')
    .select('*, team:teams(*)')
    .eq('tenant_id', tenant.id)
    .order('precio_actual', { ascending: false })

  const { data: leaderboard } = await supabase.rpc('get_leaderboard', {
    p_tenant_id: tenant.id,
    p_limit: 10,
  })

  return (
    <PantallaPublicaCliente
      tenant={tenant}
      assetsIniciales={assets ?? []}
      leaderboardInicial={leaderboard ?? []}
    />
  )
}
