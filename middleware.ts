import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const RUTAS_PROTEGIDAS = ['/mercado', '/portafolio', '/liga', '/admin', '/onboarding', '/equipo']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Saltar rutas de API y archivos estáticos
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Extraer la ruta sin el prefijo de idioma (e.g. /en/mercado → /mercado)
  const pathSinLocale = pathname.replace(/^\/(es|en)(\/|$)/, '/')

  const esProtegida = RUTAS_PROTEGIDAS.some(r =>
    pathSinLocale === r || pathSinLocale.startsWith(r + '/')
  )

  if (esProtegida) {
    // Verificar sesión de Supabase
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Detectar locale actual para redirigir correctamente
      const localeMatch = pathname.match(/^\/(es|en)(\/|$)/)
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale
      const url = request.nextUrl.clone()
      url.pathname = locale === routing.defaultLocale ? '/login' : `/${locale}/login`
      return NextResponse.redirect(url)
    }

    return response
  }

  // Para rutas públicas, aplicar solo el middleware de i18n
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
