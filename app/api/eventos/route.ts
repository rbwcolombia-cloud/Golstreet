// API Route: Registrar evento en vivo (gol, tarjeta, etc.)
// Uso interno del admin o integración con API-Football
import { NextRequest, NextResponse } from 'next/server'
import { MarketEngine } from '@/lib/engine/market-engine'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'
import type { TipoEvento } from '@/types'

export async function POST(request: NextRequest) {
  // Verificar API key interna para operaciones del motor
  const apiKey = request.headers.get('x-api-key')
  if (!process.env.INTERNAL_API_KEY || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { tenant_id, team_id, tipo_evento, descripcion, jugador_nombre, partido_id } = body

  if (!tenant_id || !team_id || !tipo_evento) {
    return NextResponse.json({ error: 'Parámetros requeridos: tenant_id, team_id, tipo_evento' }, { status: 400 })
  }

  const engine = new MarketEngine(tenant_id)
  const evento = await engine.aplicarEventoEnVivo(
    team_id,
    tipo_evento as TipoEvento,
    descripcion,
    jugador_nombre,
    partido_id,
  )

  if (!evento) {
    return NextResponse.json({ error: 'No se pudo aplicar el evento' }, { status: 500 })
  }

  return NextResponse.json({ evento, exitoso: true })
}
