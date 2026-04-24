import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrokerPersonal } from '@/components/broker/broker-personal'
import { ModoWhatIf } from '@/components/mercado/modo-what-if'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: miembro } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('activo', true)
    .limit(1)
    .single()

  return (
    <div className="relative">
      {children}
      {miembro && (
        <>
          <BrokerPersonal userId={user.id} tenantId={miembro.tenant_id} />
          <ModoWhatIf userId={user.id} tenantId={miembro.tenant_id} />
        </>
      )}
    </div>
  )
}
