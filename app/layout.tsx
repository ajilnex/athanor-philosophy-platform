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
  title: "L'athanor — Plateforme philosophique",
  description: "L'athanor — Une collection d'articles de philosophie contemporaine",
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
        className={`min-h-screen bg-background text-foreground ${inter.variable} ${ibmPlexSerif.variable} font-serif`}
      >
        <AppSessionProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-14">{children}</main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--subtle) / 0.3)',
              },
            }}
          />
        </AppSessionProvider>
      </body>
    </html>
  )
}
