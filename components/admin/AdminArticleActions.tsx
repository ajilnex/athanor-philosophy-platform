'use client'

import { useState } from 'react'
import { Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { toggleArticlePublished, deleteArticle } from '@/app/admin/actions'

interface Article {
  id: string
  title: string
  isPublished: boolean
}

interface AdminArticleActionsProps {
  article: Article
}

export function AdminArticleActions({ article }: AdminArticleActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleTogglePublished() {
    setIsLoading(true)
    try {
      const result = await toggleArticlePublished(article.id)
      if (!result.success) {
        alert('Erreur lors de la mise à jour')
      }
    } catch (error) {
      alert('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteArticle() {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer définitivement l'article "${article.title}" ?\n\nCette action est irréversible.`
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
        href={`/articles/${article.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Voir l'article"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
      
      <button
        onClick={handleTogglePublished}
        disabled={isLoading}
        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        title={article.isPublished ? 'Dépublier' : 'Publier'}
      >
        {article.isPublished ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
      
      <button
        onClick={handleDeleteArticle}
        disabled={isLoading}
        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Supprimer l'article"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}