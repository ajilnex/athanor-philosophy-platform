'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ForgetButtonProps {
  slug: string
  title: string
  onBilletDeleted: () => void
}

export function ForgetButton({ slug, title, onBilletDeleted }: ForgetButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/billets/${slug}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      // Notifier le parent que le billet a été supprimé
      onBilletDeleted()
      
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression du billet')
      setShowConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50 font-light"
          title={`Confirmer la suppression de "${title}"`}
        >
          {isDeleting ? '...' : 'Confirmer'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isDeleting}
          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 font-light"
        >
          Annuler
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      className="text-subtle hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded text-xs font-light inline-flex items-center space-x-1"
      title={`Oublier "${title}"`}
    >
      <X className="h-3 w-3" />
      <span>Oublier</span>
    </button>
  )
}