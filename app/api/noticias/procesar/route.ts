// API Route: Cron job para procesar noticias con IA (cada 5 minutos)
// Vercel Cron envía GET con header Authorization: Bearer <CRON_SECRET>
import { NextRequest, NextResponse } from 'next/server'
import { NewsAnalyst } from '@/lib/engine/news-analyst'

async function handler(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const analyst = new NewsAnalyst()
  await analyst.ejecutarCicloCompleto()

  return NextResponse.json({ mensaje: 'Ciclo de noticias ejecutado', timestamp: new Date().toISOString() })
}

export { handler as GET, handler as POST }
