'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus } from 'lucide-react'
import { Billet } from '@/lib/billets'
import { BilletsList } from './BilletsList'
import { BilletEditor } from './BilletEditor'

interface BilletsPageClientProps {
  initialBillets: Billet[]
}

export function BilletsPageClient({ initialBillets }: BilletsPageClientProps) {
  const { data: session } = useSession()
  const [showEditor, setShowEditor] = useState(false)
  const [billets, setBillets] = useState(initialBillets)

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const handleCreateBillet = async (data: any) => {
    try {
      const response = await fetch('/api/admin/billets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      const result = await response.json()

      // Rafraîchir la page pour voir le nouveau billet
      window.location.reload()
    } catch (error) {
      console.error('Erreur création:', error)
      throw error
    }
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-light text-foreground">Billets</h1>

          {isAdmin && (
            <button
              onClick={() => setShowEditor(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau billet</span>
            </button>
          )}
        </div>

        <p className="text-sm sm:text-base text-subtle max-w-3xl font-light">
          Pensées, réflexions et explorations philosophiques publiées au fil des jours. Un
          laboratoire d'idées en mouvement.
        </p>
      </div>

      <BilletsList initialBillets={billets} />

      <BilletEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        mode="create"
        userRole={isAdmin ? 'ADMIN' : 'USER'}
        onSave={handleCreateBillet}
      />
    </>
  )
}
