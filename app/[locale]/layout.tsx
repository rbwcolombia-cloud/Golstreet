import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import '../globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GolStreet — El Wall Street del Mundial FIFA 2026',
  description: 'Compra y vende partes de selecciones nacionales. El mercado más emocionante del Mundial FIFA 2026.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icon-app.png',
  },
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} dark`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster
          richColors
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'oklch(0.13 0.028 263)',
              border: '1px solid oklch(0.22 0.031 263)',
              color: 'oklch(0.985 0.002 265)',
            },
          }}
        />
      </body>
    </html>
  )
}
