'use client'

import { useState } from 'react'
import { Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'

interface Article {
  id: string
  title: string
  isPublished: boolean
}

interface ArticleActionsProps {
  article: Article
  onDelete: (id: string) => void
  onTogglePublish: (id: string, isPublished: boolean) => void
}

export function ArticleActions({ article, onDelete, onTogglePublish }: ArticleActionsProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function togglePublished() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || 'default-dev-key'
        },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      })

      if (response.ok) {
        onTogglePublish(article.id, !article.isPublished)
      } else {
        alert('Erreur lors de la mise à jour')
      }
    } catch (error) {
      alert('Erreur réseau')
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteArticle() {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer définitivement l'article "${article.title}" ?\n\nCette action est irréversible.`
    if (!confirm(confirmMessage)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || 'default-dev-key'
        }
      })

      if (response.ok) {
        onDelete(article.id)
      } else {
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
        onClick={togglePublished}
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
        onClick={deleteArticle}
        disabled={isLoading}
        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Supprimer l'article"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}