// API Route: Cron job para procesar noticias con IA (cada 5 minutos)
import { NextRequest, NextResponse } from 'next/server'
import { NewsAnalyst } from '@/lib/engine/news-analyst'

export async function POST(request: NextRequest) {
  // Verificado por Vercel Cron o llamada interna
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const analyst = new NewsAnalyst()
  await analyst.ejecutarCicloCompleto()

  return NextResponse.json({ mensaje: 'Ciclo de noticias ejecutado', timestamp: new Date().toISOString() })
}

// También acepta GET para facilitar pruebas en desarrollo
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Solo disponible en desarrollo' }, { status: 403 })
  }

  const analyst = new NewsAnalyst()
  await analyst.ejecutarCicloCompleto()

  return NextResponse.json({ mensaje: 'Ciclo de noticias ejecutado', timestamp: new Date().toISOString() })
}
