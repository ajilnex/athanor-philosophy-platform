'use client'

import { useState } from 'react'
import { Trash2, ExternalLink } from 'lucide-react'
import { deleteArticle } from '@/app/admin/actions'

interface Publication {
  id: string
  title: string
}

interface AdminArticleActionsProps {
  article: Publication
}

export function AdminArticleActions({ article }: AdminArticleActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleDeletePublication() {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer définitivement la publication "${article.title}" ?\n\nCette action est irréversible.`
    if (!confirm(confirmMessage)) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deleteArticle(article.id)
      if (!result.success) {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      alert('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <a
        href={`/publications/${article.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-subtle hover:text-foreground hover:bg-gray-100 rounded-lg transition-colors"
        title="Voir la publication"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
      
      <button
        onClick={handleDeletePublication}
        disabled={isLoading}
        className="p-2 text-subtle hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Supprimer la publication"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}