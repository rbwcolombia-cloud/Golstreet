// GET /api/fixtures?grupo=A&jornada=1&tenant_id=xxx
// Devuelve los partidos del calendario con resultados simulados
import { NextRequest, NextResponse } from 'next/server'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const grupo = searchParams.get('grupo')
  const jornada = searchParams.get('jornada')

  const supabase = await crearClienteSupabaseServidor()

  let query = supabase
    .from('fixtures')
    .select(`
      id, grupo, jornada, fecha_hora, ciudad, simulado, local_goles, visitante_goles,
      local:teams!fixtures_local_id_fkey(id, nombre, codigo_pais, bandera_url, precio_ipo),
      visitante:teams!fixtures_visitante_id_fkey(id, nombre, codigo_pais, bandera_url, precio_ipo)
    `)
    .order('fecha_hora', { ascending: true })

  if (grupo) query = query.eq('grupo', grupo.toUpperCase())
  if (jornada) query = query.eq('jornada', parseInt(jornada))

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ fixtures: data ?? [] })
}
