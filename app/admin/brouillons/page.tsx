import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DraftsList } from '@/components/admin/DraftsList'

export const metadata = {
  title: "Brouillons - Administration - L'Athanor",
  description: "Gérer les brouillons de billets en cours d'écriture",
}

export default async function BrouillonsPage() {
  const session = await getServerSession(authOptions)

  // Seuls les admins peuvent accéder aux brouillons
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-subtle/20 backdrop-blur-sm" style={{ backgroundColor: 'rgba(238, 232, 213, 0.8)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-foreground">Brouillons</h1>
              <p className="text-sm text-subtle mt-1">
                Billets en cours d'écriture sauvegardés automatiquement
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <DraftsList />
      </main>
    </div>
  )
}
