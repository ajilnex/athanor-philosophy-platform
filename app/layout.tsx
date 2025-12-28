import type { Metadata, Viewport } from 'next'
import { Inter, IBM_Plex_Serif } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import AppSessionProvider from '@/components/SessionProvider'
import { Toaster } from 'react-hot-toast'

// Original font setup
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://athanor-philosophy-platform.vercel.app'),
  title: "L'athanor — Plateforme philosophique",
  description: "L'athanor — Une collection d'articles de philosophie contemporaine",
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  alternates: {
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    title: "L'athanor",
    description: "Une collection d'articles de philosophie contemporaine",
    siteName: "L'athanor",
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: "L'athanor — Plateforme philosophique",
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "L'athanor — Plateforme philosophique",
    description: "Une collection d'articles de philosophie contemporaine",
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: "L'athanor — Plateforme philosophique",
      },
    ],
  },
  // Meta tags supplémentaires pour Facebook
  other: {
    'fb:app_id': '', // Optionnel : ID d'app Facebook si tu en as un
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`min-h-screen flex flex-col bg-background text-foreground ${inter.variable} ${ibmPlexSerif.variable} font-serif`}
      >
        <AppSessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer className="mt-auto" />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--subtle)',
              },
            }}
          />
        </AppSessionProvider>
      </body>
    </html>
  )
}
