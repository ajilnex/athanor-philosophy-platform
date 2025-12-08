'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Edit3, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface EditBilletButtonProps {
  slug: string
  title: string
  content: string
  tags: string[]
  excerpt?: string
  className?: string
  onDelete?: (slug: string) => void
}

export function EditBilletButton({ slug, title, className = '', onDelete }: EditBilletButtonProps) {
  const { data: session, status } = useSession()
  const [isDeleting, setIsDeleting] = useState(false)

  // Seuls les utilisateurs avec rôle USER ou ADMIN peuvent contribuer
  if (status === 'loading') return null
  if (!session?.user) return null

  const userRole = session.user.role
  if (userRole === 'VISITOR') return null

  const isAdmin = userRole === 'ADMIN'

  const handleDeleteBillet = async () => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer le billet "${title}" ?\n\nIl sera déplacé vers le dossier trash et ne sera plus visible nulle part.`
      )
    ) {
      return
    }

    setIsDeleting(true)

    // 1. Suppression visuelle instantanée (UX optimiste)
    if (onDelete) {
      onDelete(slug)
      toast.success('Billet supprimé')
    }

    try {
      // 2. Appel API en arrière-plan (déclenche le déploiement)
      const response = await fetch(`/api/admin/billets/${slug}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      await response.json()

      // Si on est sur la page du billet, rediriger vers la liste
      if (!onDelete) {
        window.location.href = '/billets'
      }
    } catch (error) {
      console.error('Erreur suppression API:', error)
      toast.error('Erreur lors de la suppression définitive')
      setIsDeleting(false)
    }
  }

  return (
    <div className={`inline-flex gap-1 ${className}`}>
      <Link
        href={`/billets/${slug}/editer`}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-[var(--sol-base2)]"
        style={{ color: 'var(--sol-base01)' }}
        title={isAdmin ? 'Éditer le billet' : 'Proposer une modification'}
      >
        <Edit3 className="h-5 w-5" />
      </Link>

      {isAdmin && (
        <button
          onClick={handleDeleteBillet}
          disabled={isDeleting}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-[var(--sol-base2)] disabled:opacity-50"
          style={{ color: 'var(--sol-red)' }}
          title={isDeleting ? 'Suppression...' : 'Supprimer le billet'}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
