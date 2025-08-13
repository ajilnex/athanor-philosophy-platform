'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, FileText, Calendar, Tag, BookOpen } from 'lucide-react'
import * as lunr from 'lunr'
import { makeSnippet } from '@/lib/search-utils'
import { MiniGraph } from '@/components/graph/MiniGraph'

interface SearchDocument {
  id: string
  type: 'billet' | 'publication'
  title: string
  content: string
  date: string
  url: string
  excerpt?: string
  tags?: string[]
}

interface SearchIndex {
  index: object
  documents: SearchDocument[]
  metadata: {
    generatedAt: string
    billetCount: number
    publicationCount: number
    totalDocuments: number
  }
}


export function UnifiedSearchClient() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null)
  const [lunrIndex, setLunrIndex] = useState<lunr.Index | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load search index on component mount
  useEffect(() => {
    async function loadSearchIndex() {
      try {
        const response = await fetch('/search-index.json')
        if (!response.ok) {
          throw new Error('Failed to load search index')
        }
        
        const data: SearchIndex = await response.json()
        setSearchIndex(data)
        
        // Reconstruct Lunr index from serialized data
        const index = lunr.Index.load(data.index)
        setLunrIndex(index)
        
      } catch (err) {
        console.error('Error loading search index:', err)
        setError('Erreur lors du chargement de l\'index de recherche')
      } finally {
        setLoading(false)
      }
    }
    
    loadSearchIndex()
  }, [])

  // Read initial query from URL parameter
  useEffect(() => {
    const initialQuery = searchParams.get('q')
    if (initialQuery) {
      setSearchQuery(initialQuery)
    }
  }, [searchParams])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !lunrIndex || !searchIndex) {
      return searchIndex?.documents || []
    }

    try {
      const results = lunrIndex.search(searchQuery.trim())
      return results.map(result => {
        const doc = searchIndex.documents.find(d => d.id === result.ref)
        return doc ? { ...doc, score: result.score } : null
      }).filter(Boolean) as (SearchDocument & { score: number })[]
    } catch (err) {
      console.error('Search error:', err)
      return []
    }
  }, [searchQuery, lunrIndex, searchIndex])


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-subtle/20 rounded mb-4"></div>
          <div className="h-12 bg-subtle/20 rounded mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-subtle/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-subtle mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Erreur de recherche
          </h3>
          <p className="text-subtle mb-6">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
          Recherche Unifiée
        </h1>
        <p className="text-lg text-subtle max-w-3xl">
          Recherchez simultanément dans les billets et les publications de L'Athanor. 
          Index généré le {searchIndex && new Date(searchIndex.metadata.generatedAt).toLocaleDateString('fr-FR')}.
        </p>
      </div>

      {/* Search Bar with Mini Graph */}
      <div className="mb-8 flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-subtle" />
            </div>
            <input
              type="text"
              placeholder="Rechercher dans billets et publications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-subtle/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-background text-foreground text-lg transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Mini Graph - shows context for top search result */}
        <div className="lg:w-80">
          <MiniGraph 
            centerNodeId={searchResults.length > 0 && searchResults[0].type === 'billet' 
              ? searchResults[0].id 
              : undefined
            }
            maxNodes={5}
            className="h-full"
          />
        </div>
      </div>

      {/* Search Stats */}
      {searchIndex && (
        <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-subtle">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>{searchIndex.metadata.billetCount} billets</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>{searchIndex.metadata.publicationCount} publications</span>
          </div>
          <div className="text-xs">
            {searchQuery.trim()
              ? `${searchResults.length} résultat(s) pour "${searchQuery}"`
              : `${searchIndex.metadata.totalDocuments} document(s) indexé(s)`
            }
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-subtle mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery.trim() ? 'Aucun résultat trouvé' : 'Commencez votre recherche'}
          </h3>
          <p className="text-subtle mb-6">
            {searchQuery.trim() 
              ? 'Essayez avec des termes différents ou moins spécifiques.'
              : 'Tapez dans la barre de recherche pour explorer le contenu.'
            }
          </p>
          {searchQuery.trim() && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {searchResults.map((doc) => (
            <article
              key={doc.id}
              className="p-6 rounded-lg border border-subtle/20 bg-background/50 shadow-sm backdrop-blur-sm hover:border-subtle/50 hover:shadow-md transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {doc.type === 'billet' ? (
                      <FileText className="h-5 w-5 text-accent" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-accent" />
                    )}
                    <span className="text-xs uppercase tracking-wide text-subtle font-medium">
                      {doc.type === 'billet' ? 'Billet' : 'Publication'}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
                    <Link
                      href={doc.url}
                      className="hover:text-accent transition-colors"
                    >
                      {doc.title}
                    </Link>
                  </h2>
                  
                  {/* Smart contextual snippet */}
                  {(() => {
                    // Génère un snippet intelligent côté client
                    const content = doc.content || doc.excerpt || ''
                    const snippetHtml = searchQuery.trim() 
                      ? makeSnippet(content, searchQuery, 300)
                      : content.substring(0, 300) + (content.length > 300 ? '...' : '')
                    
                    return (
                      <div 
                        className="text-foreground/80 text-sm leading-relaxed mb-4 card-search-result"
                        dangerouslySetInnerHTML={{ __html: snippetHtml }}
                      />
                    )
                  })()}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-subtle mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(doc.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {'score' in doc && (
                      <div className="text-xs opacity-60">
                        Score: {Math.round((1 - (doc.score as number)) * 100)}%
                      </div>
                    )}
                  </div>
                  
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-subtle" />
                      <div className="flex flex-wrap gap-2">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-accent/10 text-accent rounded-full"
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
                    href={
                      doc.type === 'publication' && searchQuery.trim()
                        ? `${doc.url}?q=${encodeURIComponent(searchQuery.trim())}`
                        : doc.url
                    }
                    className="px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors text-center inline-flex items-center justify-center space-x-2"
                  >
                    {doc.type === 'billet' ? (
                      <>
                        <FileText className="h-4 w-4" />
                        <span>Lire le billet</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4" />
                        <span>Voir la publication</span>
                      </>
                    )}
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