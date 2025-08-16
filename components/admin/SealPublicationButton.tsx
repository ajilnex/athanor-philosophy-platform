'use client'

import { useState } from 'react'
import { Lock, Unlock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface SealPublicationButtonProps {
  articleId: string
  initialSealed?: boolean
}

export function SealPublicationButton({
  articleId,
  initialSealed = false,
}: SealPublicationButtonProps) {
  const [isSealed, setIsSealed] = useState(initialSealed)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleSeal = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/publications/${articleId}/seal`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sealed: !isSealed }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors du scellement')
      }

      const result = await response.json()
      setIsSealed(result.isSealed)

      // Recharger la page pour voir les changements
      window.location.reload()
    } catch (error) {
      console.error('Erreur scellement:', error)
      toast.error('Erreur lors du scellement de la publication')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleSeal}
      disabled={isLoading}
      className={`p-2 rounded-lg transition-colors ${
        isSealed
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-subtle hover:text-foreground hover:bg-muted'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={
        isSealed
          ? 'Désceller cette publication (visible par tous)'
          : 'Sceller cette publication (admin uniquement)'
      }
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSealed ? (
        <Lock className="h-4 w-4" />
      ) : (
        <Unlock className="h-4 w-4" />
      )}
    </button>
  )
}
