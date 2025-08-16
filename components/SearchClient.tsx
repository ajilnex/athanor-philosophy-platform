'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, FileText, User, Calendar, Tag, Download } from 'lucide-react'
import Fuse from 'fuse.js'

interface Article {
  id: string
  title: string
  description: string | null
  author: string | null
  fileName: string
  tags: string[]
  publishedAt: string | Date
  fileSize: number
}

interface SearchClientProps {
  articles: Article[]
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function SearchClient({ articles }: SearchClientProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize Fuse.js with articles
  const fuse = useMemo(() => {
    return new Fuse(articles, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'author', weight: 0.2 },
        { name: 'tags', weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
    })
  }, [articles])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return articles
    }
    return fuse.search(searchQuery.trim()).map(result => result.item)
  }, [searchQuery, fuse, articles])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-900 mb-4">
          Rechercher des Articles
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Explorez notre collection d'articles philosophiques en utilisant la recherche par titre,
          auteur, description ou tags.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher des articles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="mb-4">
        <p className="text-gray-600">
          {searchQuery.trim()
            ? `${searchResults.length} résultat(s) pour "${searchQuery}"`
            : `${articles.length} article(s) disponible(s)`}
        </p>
      </div>

      {searchResults.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchQuery.trim() ? 'Aucun résultat trouvé' : 'Aucun article disponible'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery.trim()
              ? 'Essayez avec des termes différents ou moins spécifiques.'
              : 'Les articles seront bientôt disponibles.'}
          </p>
          {searchQuery.trim() && (
            <button onClick={() => setSearchQuery('')} className="btn-primary">
              Voir tous les articles
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {searchResults.map((article: Article) => (
            <article
              key={article.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-serif font-semibold text-primary-900 mb-3">
                    <Link
                      href={`/billets/${article.id}`}
                      className="hover:text-primary-700 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h2>

                  {article.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{article.description}</p>
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
                        {(article.publishedAt instanceof Date
                          ? article.publishedAt
                          : new Date(article.publishedAt)
                        ).toLocaleDateString('fr-FR', {
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
                        {article.tags.map(tag => (
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
                    href={`/billets/${article.id}`}
                    className="btn-primary text-center inline-flex items-center justify-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Lire le billet</span>
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
