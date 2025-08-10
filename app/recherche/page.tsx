'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, FileText, Calendar, Tag } from 'lucide-react'

interface BilletResult {
  type: 'billet'
  slug: string
  title: string
  date: string
  tags: string[]
  excerpt: string
}

interface SearchResponse {
  results: BilletResult[]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function RecherchePage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BilletResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Debounce search
  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setError('')
      
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!response.ok) {
          throw new Error('Erreur de recherche')
        }
        
        const data: SearchResponse = await response.json()
        setResults(data.results)
      } catch (err) {
        setError('Erreur lors de la recherche')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Read initial query from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q')
    if (urlQuery) {
      setQuery(urlQuery)
    }
  }, [searchParams])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
          Recherche
        </h1>
        <p className="text-lg text-subtle font-light">
          Explorez notre collection de billets philosophiques
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-subtle" />
          </div>
          <input
            type="text"
            placeholder="Rechercher dans les billets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-subtle rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground 
                       text-lg bg-white"
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        {isLoading && (
          <p className="text-subtle">Recherche en cours...</p>
        )}
        {error && (
          <p className="text-red-600">{error}</p>
        )}
        {!isLoading && !error && query.length >= 2 && (
          <p className="text-subtle">
            {results.length} résultat(s) pour "{query}"
          </p>
        )}
        {!isLoading && !error && query.length < 2 && query.length > 0 && (
          <p className="text-subtle">
            Tapez au moins 2 caractères pour rechercher
          </p>
        )}
      </div>

      {/* Results List */}
      {results.length === 0 && query.length >= 2 && !isLoading && !error ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-subtle mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-subtle mb-2">
            Aucun résultat trouvé
          </h3>
          <p className="text-subtle mb-6">
            Essayez avec des termes différents ou moins spécifiques.
          </p>
          <button
            onClick={() => setQuery('')}
            className="btn-primary"
          >
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {results.map((billet) => (
            <article
              key={billet.slug}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-serif font-semibold text-foreground mb-3">
                    <Link
                      href={`/billets/${billet.slug}`}
                      className="hover:text-foreground/70 transition-colors"
                    >
                      {billet.title}
                    </Link>
                  </h2>
                  
                  {billet.excerpt && (
                    <p className="text-subtle mb-4 line-clamp-3">
                      {billet.excerpt}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-subtle mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(billet.date)}</span>
                    </div>
                  </div>
                  
                  {billet.tags && billet.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mb-4">
                      <Tag className="h-4 w-4 text-subtle" />
                      <div className="flex flex-wrap gap-2">
                        {billet.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
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
                    href={`/billets/${billet.slug}`}
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
      
      {/* Help text when no query */}
      {query.length === 0 && (
        <div className="text-center py-12 text-subtle">
          <Search className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Recherchez dans nos billets
          </h3>
          <p className="mb-4">
            Utilisez le champ ci-dessus pour rechercher par titre, contenu ou tags.
          </p>
          <p className="text-sm">
            La recherche se déclenche automatiquement après 2 caractères.
          </p>
        </div>
      )}
    </div>
  )
}