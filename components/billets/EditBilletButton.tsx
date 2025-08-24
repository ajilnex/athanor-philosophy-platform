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

  const userRole = (session.user as any)?.role
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

      const result = await response.json()
      console.log('✅ Suppression confirmée côté serveur:', result.message)

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
    <div className={`inline-flex gap-2 ${className}`}>
      <Link
        href={`/billets/${slug}/editer`}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-subtle/30 text-foreground rounded-lg hover:bg-muted transition-all"
      >
        <Edit3 className="h-4 w-4" />
        <span>{isAdmin ? 'Éditer' : 'Proposer modification'}</span>
      </Link>

      {isAdmin && (
        <button
          onClick={handleDeleteBillet}
          disabled={isDeleting}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-all disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>{isDeleting ? 'Suppression...' : 'Supprimer'}</span>
        </button>
      )}
    </div>
  )
}
