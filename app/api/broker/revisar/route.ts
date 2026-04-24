// Cron: revisar situaciones y generar alertas del broker (cada 5 min)
import { NextRequest, NextResponse } from 'next/server'
import { BrokerAlertas } from '@/lib/engine/broker-alertas'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('mercado_activo', true)

  if (!tenants) return NextResponse.json({ ok: true, tenants: 0 })

  for (const tenant of tenants) {
    const broker = new BrokerAlertas(tenant.id)
    await broker.ejecutarRevisionCompleta()
  }

  return NextResponse.json({ ok: true, tenants: tenants.length })
}
