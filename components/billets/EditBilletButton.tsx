'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Edit3, Trash2 } from 'lucide-react'
import { BilletEditor } from './BilletEditor'
import toast from 'react-hot-toast'

interface EditBilletButtonProps {
  slug: string
  title: string
  content: string
  tags: string[]
  excerpt?: string
  className?: string
}

export function EditBilletButton({ 
  slug, 
  title, 
  content, 
  tags, 
  excerpt, 
  className = "" 
}: EditBilletButtonProps) {
  const { data: session, status } = useSession()
  const [showEditor, setShowEditor] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Seuls les utilisateurs avec rôle USER ou ADMIN peuvent contribuer
  if (status === 'loading') return null
  if (!session?.user) return null
  
  const userRole = (session.user as any)?.role
  if (userRole === 'VISITOR') return null

  const isAdmin = userRole === 'ADMIN'

  const handleUpdateBillet = async (data: any) => {
    try {
      const response = await fetch(`/api/admin/billets/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la mise à jour')
      }

      const result = await response.json()
      
      if (result.type === 'pull_request') {
        // Pour les contributions, afficher un message différent
        toast.success(`${result.message}\nVotre Pull Request: ${result.pullRequest.html_url}`, {
          duration: 8000,
        })
      } else {
        // Pour les admins, recharger la page
        window.location.reload()
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      throw error
    }
  }

  const handleDeleteBillet = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le billet "${title}" ?\n\nIl sera déplacé vers le dossier trash et ne sera plus visible nulle part.`)) {
      return
    }

    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/admin/billets/${slug}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }

      const result = await response.json()
      toast.success(result.message)
      
      // Rediriger vers la liste des billets
      window.location.href = '/billets'
    } catch (error) {
      console.error('Erreur suppression:', error)
      toast.error('Erreur lors de la suppression')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className={`inline-flex gap-2 ${className}`}>
        <button
          onClick={() => setShowEditor(true)}
          className="btn btn-secondary text-xs"
        >
          <Edit3 className="h-4 w-4" />
          <span>
            {isAdmin ? 'Éditer' : 'Proposer modification'}
          </span>
        </button>
        
        {isAdmin && (
          <button
            onClick={handleDeleteBillet}
            disabled={isDeleting}
            className="btn btn-danger text-xs"
          >
            <Trash2 className="h-4 w-4" />
            <span>
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </span>
          </button>
        )}
      </div>

      <BilletEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        mode="edit"
        userRole={(session.user as any).role}
        initialData={{
          slug,
          title,
          content,
          tags,
          excerpt,
        }}
        onSave={handleUpdateBillet}
      />
    </>
  )
}