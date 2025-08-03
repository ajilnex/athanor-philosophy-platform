'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, FileText, User, Calendar, Tag } from 'lucide-react'
import Fuse from 'fuse.js'

interface Article {
  id: string
  title: string
  description: string | null
  author: string | null
  fileName: string
  tags: string[]
  publishedAt: string
  fileSize: number
}

export default function SearchPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fuse, setFuse] = useState<Fuse<Article> | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [])

  useEffect(() => {
    if (fuse && searchQuery.trim()) {
      const results = fuse.search(searchQuery.trim())
      setSearchResults(results.map(result => result.item))
    } else {
      setSearchResults(articles)
    }
  }, [searchQuery, fuse, articles])

  async function fetchArticles() {
    try {
      const response = await fetch('/api/articles')
      if (response.ok) {
        const data = await response.json()
        setArticles(data)
        
        // Initialize Fuse.js for fuzzy search
        const fuseInstance = new Fuse(data as Article[], {
          keys: [
            { name: 'title', weight: 0.4 },
            { name: 'description', weight: 0.3 },
            { name: 'author', weight: 0.2 },
            { name: 'tags', weight: 0.1 },
          ],
          threshold: 0.4,
          includeScore: true,
        })
        setFuse(fuseInstance)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-900 mb-4">
          Recherche d'Articles
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Trouvez rapidement les articles qui vous intéressent en recherchant par titre, 
          auteur, description ou mots-clés.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher des articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="mb-4">
        <p className="text-gray-600">
          {isLoading
            ? 'Chargement...'
            : searchQuery.trim()
            ? `${searchResults.length} résultat(s) pour "${searchQuery}"`
            : `${articles.length} article(s) disponible(s)`
          }
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchQuery.trim() ? 'Aucun résultat trouvé' : 'Aucun article disponible'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery.trim()
              ? 'Essayez avec des mots-clés différents ou plus généraux.'
              : 'Les articles seront bientôt disponibles.'
            }
          </p>
          {!searchQuery.trim() && (
            <Link href="/admin" className="btn-primary">
              Ajouter des Articles
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {searchResults.map((article) => (
            <article
              key={article.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-serif font-semibold text-primary-900 mb-3">
                    <Link
                      href={`/articles/${article.id}`}
                      className="hover:text-primary-700 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h2>
                  
                  {article.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    {article.author && (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{article.author}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{formatFileSize(article.fileSize)}</span>
                    </div>
                  </div>
                  
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mb-4">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="lg:w-48 flex flex-col space-y-3">
                  <Link
                    href={`/articles/${article.id}`}
                    className="btn-primary text-center"
                  >
                    Lire l'Article
                  </Link>
                  <Link
                    href={`/articles/${article.id}/pdf`}
                    className="btn-secondary text-center"
                    target="_blank"
                  >
                    Ouvrir PDF
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}