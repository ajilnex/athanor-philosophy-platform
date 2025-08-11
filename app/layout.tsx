import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import AppSessionProvider from '@/components/SessionProvider'
import TinaProvider from '@/components/TinaProvider'

export const metadata: Metadata = {
  title: "L’athanor — Plateforme philosophique",
  description: "L’athanor — Une collection d’articles de philosophie contemporaine",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <TinaProvider>
          <AppSessionProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </AppSessionProvider>
        </TinaProvider>
      </body>
    </html>
  )
}