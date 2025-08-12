'use client'

import { useState } from 'react'
import { Lock, Unlock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface SealBilletButtonProps {
  slug: string
  initialSealed?: boolean
}

export function SealBilletButton({ slug, initialSealed = false }: SealBilletButtonProps) {
  const [isSealed, setIsSealed] = useState(initialSealed)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleSeal = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/admin/billets/${slug}/seal`, {
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
      toast.error('Erreur lors du scellement du billet')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggleSeal}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
        isSealed
          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'bg-muted text-subtle hover:bg-muted/70'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isSealed ? 'Désceller ce billet (visible par tous)' : 'Sceller ce billet (admin uniquement)'}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isSealed ? (
        <Lock className="h-3 w-3" />
      ) : (
        <Unlock className="h-3 w-3" />
      )}
      <span>{isLoading ? 'Traitement...' : isSealed ? 'Scellé' : 'Sceller'}</span>
    </button>
  )
}