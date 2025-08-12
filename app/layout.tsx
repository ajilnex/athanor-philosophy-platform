import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import AppSessionProvider from '@/components/SessionProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: "L'athanor — Plateforme philosophique",
  description: "L'athanor — Une collection d'articles de philosophie contemporaine",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground">
        <AppSessionProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
                {children}
              </main>
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