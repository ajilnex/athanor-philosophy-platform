'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'

interface Article {
  id: string
  title: string
  isPublished: boolean
}

interface ArticleActionsProps {
  article: Article
}

export function ArticleActions({ article }: ArticleActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function togglePublished() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Erreur lors de la mise à jour')
      }
    } catch (error) {
      alert('Erreur réseau')
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  async function deleteArticle() {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${article.title}" ?`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      alert('Erreur réseau')
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        disabled={isLoading}
      >
        <MoreHorizontal className="h-4 w-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-10 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
            <a
              href={`/articles/${article.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Voir</span>
            </a>
            
            <button
              onClick={togglePublished}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left disabled:opacity-50"
            >
              {article.isPublished ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Dépublier</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Publier</span>
                </>
              )}
            </button>
            
            <hr className="my-2" />
            
            <button
              onClick={deleteArticle}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Supprimer</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}