import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evita que la app sea embebida en iframes de otros dominios (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // El navegador no intenta adivinar el Content-Type
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Solo envía el origen en requests cross-origin (no la URL completa)
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Deshabilita features que la app no usa
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Fuerza HTTPS durante 1 año (solo efectivo en producción con TLS)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
