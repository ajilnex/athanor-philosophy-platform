'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Edit3 } from 'lucide-react'
import { BilletEditor } from './BilletEditor'

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

  // Seuls les admins peuvent éditer
  if (status === 'loading') return null
  if (!session?.user || session.user.role !== 'admin') return null

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

      // Rafraîchir la page pour voir les changements
      window.location.reload()
    } catch (error) {
      console.error('Erreur mise à jour:', error)
      throw error
    }
  }

  return (
    <>
      <div className={`inline-flex ${className}`}>
        <button
          onClick={() => setShowEditor(true)}
          className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm text-subtle hover:text-foreground border border-subtle hover:border-foreground transition-all duration-200 rounded-md bg-white hover:bg-gray-50"
        >
          <Edit3 className="h-4 w-4" />
          <span>Éditer</span>
        </button>
      </div>

      <BilletEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        mode="edit"
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