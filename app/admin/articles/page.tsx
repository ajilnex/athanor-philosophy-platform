'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { ArticleActions } from '@/components/admin/ArticleActions'

interface Article {
  id: string
  title: string
  description: string | null
  author: string | null
  isPublished: boolean
  fileSize: number
  createdAt: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [])

  async function fetchArticles() {
    try {
      const response = await fetch('/api/admin/articles', {
        headers: {
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || 'default-dev-key'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setArticles(data)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleDelete(articleId: string) {
    setArticles(prev => prev.filter(article => article.id !== articleId))
  }

  function handleTogglePublish(articleId: string, isPublished: boolean) {
    setArticles(prev => 
      prev.map(article => 
        article.id === articleId 
          ? { ...article, isPublished }
          : article
      )
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <p className="text-gray-500">Chargement des articles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-primary-700 hover:text-primary-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'administration
        </Link>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary-900 mb-4">
              Gestion des Articles
            </h1>
            <p className="text-lg text-gray-600">
              Gérez tous vos articles: modifier, publier/dépublier, supprimer.
            </p>
          </div>
          <Link
            href="/admin/upload"
            className="btn-primary"
          >
            Ajouter un Article
          </Link>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-xl font-semibold text-gray-600 mb-4">
            Aucun article trouvé
          </h3>
          <p className="text-gray-500 mb-6">
            Commencez par ajouter votre premier article.
          </p>
          <Link
            href="/admin/upload"
            className="btn-primary"
          >
            Ajouter un Article
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-2 font-semibold text-gray-900">
                    Titre
                  </th>
                  <th className="text-left py-4 px-2 font-semibold text-gray-900">
                    Auteur
                  </th>
                  <th className="text-left py-4 px-2 font-semibold text-gray-900">
                    Statut
                  </th>
                  <th className="text-left py-4 px-2 font-semibold text-gray-900">
                    Taille
                  </th>
                  <th className="text-left py-4 px-2 font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="text-right py-4 px-2 font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="py-4 px-2">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {article.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-gray-600">
                      {article.author || '-'}
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center space-x-2">
                        {article.isPublished ? (
                          <>
                            <Eye className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">
                              Publié
                            </span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500 font-medium">
                              Brouillon
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-gray-600 text-sm">
                      {formatFileSize(article.fileSize)}
                    </td>
                    <td className="py-4 px-2 text-gray-600 text-sm">
                      {new Date(article.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-4 px-2">
                      <ArticleActions 
                        article={article} 
                        onDelete={handleDelete}
                        onTogglePublish={handleTogglePublish}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}