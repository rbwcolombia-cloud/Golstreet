import { NextRequest, NextResponse } from 'next/server'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function crearAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Verifica que el usuario es admin del tenant */
async function verificarAdmin(supabase: Awaited<ReturnType<typeof crearClienteSupabaseServidor>>, tenantId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = crearAdminClient()
  const { data } = await admin
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .eq('rol', 'admin')
    .single()

  return data ? user : null
}

/** POST — agrega una lista de emails a la liga */
export async function POST(request: NextRequest) {
  const supabase = await crearClienteSupabaseServidor()
  const { tenant_id, emails } = await request.json() as { tenant_id: string; emails: string[] }

  const user = await verificarAdmin(supabase, tenant_id)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: 'No se recibieron emails' }, { status: 400 })
  }

  // Filtra emails válidos y elimina duplicados
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailsLimpios = [...new Set(
    emails
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => EMAIL_RE.test(e))
  )]

  if (emailsLimpios.length === 0) {
    return NextResponse.json({ error: 'Ningún email válido en la lista' }, { status: 400 })
  }

  // Inserta ignorando duplicados (ON CONFLICT DO NOTHING via upsert)
  const admin = crearAdminClient()
  const rows = emailsLimpios.map(email => ({ tenant_id, email }))

  const { error } = await admin
    .from('invitaciones')
    .upsert(rows, { onConflict: 'tenant_id,email', ignoreDuplicates: true })

  if (error) {
    console.error('Error inserting invitaciones:', error)
    return NextResponse.json({ error: 'Error al guardar invitaciones' }, { status: 500 })
  }

  // Devuelve la lista actualizada
  const { data: invitaciones } = await admin
    .from('invitaciones')
    .select('id, email, nombre, usado, usado_en')
    .eq('tenant_id', tenant_id)
    .order('creado_en', { ascending: false })

  return NextResponse.json({
    ok: true,
    agregados: emailsLimpios.length,
    invitaciones: invitaciones ?? [],
  })
}

/** DELETE — elimina una invitación por id */
export async function DELETE(request: NextRequest) {
  const supabase = await crearClienteSupabaseServidor()
  const { id, tenant_id } = await request.json() as { id: string; tenant_id: string }

  if (!id || !tenant_id) return NextResponse.json({ error: 'Falta id o tenant_id' }, { status: 400 })

  // Verificar admin PRIMERO (antes de cualquier operación de DB con service role)
  const user = await verificarAdmin(supabase, tenant_id)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const admin = crearAdminClient()

  // Luego leer y eliminar — verificando que la invitación pertenece al tenant del admin
  const { data: inv } = await admin
    .from('invitaciones')
    .select('tenant_id, usado')
    .eq('id', id)
    .eq('tenant_id', tenant_id) // doble verificación de ownership
    .single()

  if (!inv) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  if (inv.usado) return NextResponse.json({ error: 'No se puede eliminar: el jugador ya ingresó' }, { status: 400 })

  await admin.from('invitaciones').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
