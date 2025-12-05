import { Inter } from 'next/font/google'
import AppSessionProvider from '@/components/SessionProvider'
import { Toaster } from 'react-hot-toast'
import '@/app/globals.css'

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-sans',
    display: 'swap',
})

export default function ImmersiveLayout({ children }: { children: React.ReactNode }) {
    // Immersive layout without navbar/footer for special experiences like Archive
    return (
        <html lang="fr" className="dark">
            <body className={`min-h-screen ${inter.variable} font-sans`}>
                <AppSessionProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: 'var(--surface)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-default)',
                            },
                        }}
                    />
                </AppSessionProvider>
            </body>
        </html>
    )
}
