// ============================================================
// GolStreet — Panel de control del Beta Acelerado
//
// POST /api/admin/beta  { accion, tenant_id, ...opciones }
//   accion: 'iniciar' | 'resetear' | 'estado'
//
// iniciar:  Activa modo_simulacion + modo_acelerado, guarda beta_inicio.
//           Resetea precios a IPO y limpia resultados previos del tenant.
// resetear: Devuelve precios a IPO, borra fixtures_simuladas del tenant,
//           desactiva modo_acelerado (listo para volver a jugar o para el Mundial real).
// estado:   Devuelve progreso: partidos jugados, jornada actual, líder del ranking.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { crearClienteSupabaseServidor } from '@/lib/supabase/server'

const WC_INICIO   = new Date('2026-06-11T21:00:00Z')
const WC_FIN_FASE = new Date('2026-07-03T21:00:00Z')
const WC_DURACION_MS = WC_FIN_FASE.getTime() - WC_INICIO.getTime()

async function verificarAdmin(supabase: Awaited<ReturnType<typeof crearClienteSupabaseServidor>>, tenantId: string, userId: string) {
  const { data } = await supabase
    .from('tenant_members')
    .select('rol')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()
  return data?.rol === 'admin'
}

export async function POST(request: NextRequest) {
  const userSupabase = await crearClienteSupabaseServidor()
  const { data: { user } } = await userSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { accion, tenant_id, duracion_dias = 7 } = body

  if (!tenant_id) return NextResponse.json({ error: 'Falta tenant_id' }, { status: 400 })
  if (!['iniciar', 'resetear', 'estado'].includes(accion)) {
    return NextResponse.json({ error: 'accion debe ser iniciar | resetear | estado' }, { status: 400 })
  }

  const esAdmin = await verificarAdmin(userSupabase, tenant_id, user.id)
  if (!esAdmin) return NextResponse.json({ error: 'No tienes permisos de administrador' }, { status: 403 })

  // Service role para operaciones privilegiadas
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── ESTADO ───────────────────────────────────────────────
  if (accion === 'estado') {
    const { data: tenant } = await svc
      .from('tenants')
      .select('modo_simulacion, modo_acelerado, beta_inicio, beta_duracion_dias, mercado_activo')
      .eq('id', tenant_id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 })
    if (!tenant.modo_acelerado || !tenant.beta_inicio) {
      return NextResponse.json({ activo: false, mensaje: 'Beta no iniciado' })
    }

    const betaDurMs   = tenant.beta_duracion_dias * 24 * 60 * 60 * 1000
    const betaInicioMs = new Date(tenant.beta_inicio).getTime()
    const transcurrido = Date.now() - betaInicioMs
    const progreso     = Math.min(100, (transcurrido / betaDurMs) * 100)
    const factor       = WC_DURACION_MS / betaDurMs
    const fechaVirtual = new Date(WC_INICIO.getTime() + transcurrido * factor)

    const { count: jugados } = await svc
      .from('fixtures_simuladas')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)

    const { count: totalFixtures } = await svc
      .from('fixtures')
      .select('*', { count: 'exact', head: true })

    // Próximo partido
    const { data: proximo } = await svc
      .from('fixtures')
      .select(`
        id, grupo, jornada, fecha_hora, ciudad,
        local:teams!fixtures_local_id_fkey(nombre, codigo_pais),
        visitante:teams!fixtures_visitante_id_fkey(nombre, codigo_pais)
      `)
      .gte('fecha_hora', fechaVirtual.toISOString())
      .not('id', 'in',
        `(SELECT fixture_id FROM fixtures_simuladas WHERE tenant_id = '${tenant_id}')`
      )
      .order('fecha_hora', { ascending: true })
      .limit(1)
      .single()

    const betaFin = new Date(betaInicioMs + betaDurMs)

    return NextResponse.json({
      activo:           true,
      progreso_pct:     Math.round(progreso),
      partidos_jugados: jugados ?? 0,
      total_partidos:   totalFixtures ?? 72,
      fecha_virtual:    fechaVirtual.toISOString(),
      beta_inicio:      tenant.beta_inicio,
      beta_fin:         betaFin.toISOString(),
      dias_restantes:   Math.max(0, Math.ceil((betaFin.getTime() - Date.now()) / 86400000)),
      proximo_partido:  proximo ?? null,
    })
  }

  // ── INICIAR ───────────────────────────────────────────────
  if (accion === 'iniciar') {
    const dias = Math.max(1, Math.min(30, Number(duracion_dias)))

    // 1. Resetear resultados previos del tenant
    await svc.from('fixtures_simuladas').delete().eq('tenant_id', tenant_id)

    // 2. Resetear precios a IPO para todos los assets del tenant
    await svc.rpc('reset_precios_ipo', { p_tenant_id: tenant_id }).maybeSingle()
    // fallback si la función no existe
    const { data: assets } = await svc
      .from('league_assets')
      .select('team_id, teams(precio_ipo)')
      .eq('tenant_id', tenant_id)

    if (assets) {
      for (const asset of assets) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const precioIpo = (asset.teams as any)?.precio_ipo
        if (!precioIpo) continue
        await svc.from('league_assets').update({
          precio_actual:        precioIpo,
          precio_apertura_dia:  precioIpo,
          ultimo_update:        new Date().toISOString(),
        }).eq('tenant_id', tenant_id).eq('team_id', asset.team_id)
      }
    }

    // 3. Limpiar historial de precios del beta anterior
    await svc.from('price_history')
      .delete()
      .eq('tenant_id', tenant_id)
      .in('motivo', ['evento_vivo', 'noticia', 'demanda'])

    // 4. Limpiar alertas anteriores del broker
    await svc.from('alerts_log')
      .delete()
      .eq('tenant_id', tenant_id)
      .eq('tipo', 'partido_simulado')

    // 5. Activar beta
    await svc.from('tenants').update({
      modo_simulacion:    true,
      modo_acelerado:     true,
      beta_inicio:        new Date().toISOString(),
      beta_duracion_dias: dias,
      mercado_activo:     true,
    }).eq('id', tenant_id)

    const betaFin = new Date(Date.now() + dias * 24 * 60 * 60 * 1000)

    return NextResponse.json({
      ok: true,
      mensaje: `¡Beta iniciado! Los 72 partidos se simularán en ${dias} días.`,
      beta_inicio:    new Date().toISOString(),
      beta_fin:       betaFin.toISOString(),
      duracion_dias:  dias,
      partidos_dia:   Math.round(72 / dias),
    })
  }

  // ── RESETEAR ──────────────────────────────────────────────
  if (accion === 'resetear') {
    // 1. Limpiar resultados del beta
    await svc.from('fixtures_simuladas').delete().eq('tenant_id', tenant_id)

    // 2. Resetear precios a IPO
    const { data: assets } = await svc
      .from('league_assets')
      .select('team_id, teams(precio_ipo)')
      .eq('tenant_id', tenant_id)

    if (assets) {
      for (const asset of assets) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const precioIpo = (asset.teams as any)?.precio_ipo
        if (!precioIpo) continue
        await svc.from('league_assets').update({
          precio_actual:       precioIpo,
          precio_apertura_dia: precioIpo,
          ultimo_update:       new Date().toISOString(),
        }).eq('tenant_id', tenant_id).eq('team_id', asset.team_id)
      }
    }

    // 3. Limpiar historial del beta
    await svc.from('price_history').delete()
      .eq('tenant_id', tenant_id)
      .in('motivo', ['evento_vivo', 'noticia', 'demanda'])

    // 4. Desactivar modo acelerado (queda listo para el Mundial real)
    await svc.from('tenants').update({
      modo_acelerado:     false,
      beta_inicio:        null,
      modo_simulacion:    false,
    }).eq('id', tenant_id)

    return NextResponse.json({
      ok: true,
      mensaje: 'Beta reseteado. Precios vueltos a IPO. Listo para el Mundial real o un nuevo beta.',
    })
  }

  return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
}

export async function GET(request: NextRequest) {
  // Alias de GET para obtener estado
  const url = new URL(request.url)
  const tenant_id = url.searchParams.get('tenant_id')
  if (!tenant_id) return NextResponse.json({ error: 'Falta tenant_id' }, { status: 400 })

  const syntheticBody = JSON.stringify({ accion: 'estado', tenant_id })
  const syntheticRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: syntheticBody,
  })
  return POST(syntheticRequest)
}
