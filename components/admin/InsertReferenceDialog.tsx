'use client'

import React, { useState, useEffect } from 'react'
import { Search, X, Book, Calendar, Users } from 'lucide-react'
import Fuse from 'fuse.js'
import { BibliographyEntry } from '@/lib/bibliography'

interface InsertReferenceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (key: string) => void
}

export function InsertReferenceDialog({ isOpen, onClose, onSelect }: InsertReferenceDialogProps) {
  const [bibliography, setBibliography] = useState<BibliographyEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fuse, setFuse] = useState<Fuse<BibliographyEntry> | null>(null)

  // Charger la bibliographie au montage
  useEffect(() => {
    if (isOpen && bibliography.length === 0) {
      setIsLoading(true)
      fetch('/bibliography.json')
        .then(response => response.json())
        .then((data: BibliographyEntry[]) => {
          setBibliography(data)

          // Configurer Fuse.js pour la recherche fuzzy
          const fuseInstance = new Fuse(data, {
            keys: [
              { name: 'title', weight: 0.4 },
              { name: 'authors.family', weight: 0.3 },
              { name: 'authors.given', weight: 0.2 },
              { name: 'year', weight: 0.1 },
              { name: 'key', weight: 0.2 },
              { name: 'container', weight: 0.1 },
            ],
            threshold: 0.3,
            includeScore: true,
            minMatchCharLength: 2,
          })
          setFuse(fuseInstance)
        })
        .catch(error => console.error('Erreur lors du chargement de la bibliographie:', error))
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, bibliography.length])

  // Réinitialiser la recherche quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
    }
  }, [isOpen])

  // Résultats de recherche
  const searchResults =
    fuse && searchTerm.trim() ? fuse.search(searchTerm).map(result => result.item) : bibliography

  const handleSelect = (key: string) => {
    onSelect(key)
    onClose()
  }

  const formatAuthors = (authors: BibliographyEntry['authors']): string => {
    if (authors.length === 0) return 'Auteur inconnu'
    if (authors.length === 1) return `${authors[0].family}, ${authors[0].given}`
    if (authors.length === 2) return `${authors[0].family} & ${authors[1].family}`
    return `${authors[0].family} et al.`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-subtle/20">
          <div className="flex items-center space-x-2">
            <Book className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-serif font-light text-foreground">Insérer une référence</h2>
          </div>
          <button onClick={onClose} className="text-subtle hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-subtle/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-subtle" />
            <input
              type="text"
              placeholder="Rechercher par auteur, titre, année ou clé..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-subtle/30 rounded-lg focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-subtle">Chargement de la bibliographie...</div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-subtle">
                {searchTerm ? 'Aucun résultat trouvé' : 'Aucune référence disponible'}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map(entry => (
                <button
                  key={entry.key}
                  onClick={() => handleSelect(entry.key)}
                  className="w-full text-left p-4 rounded-lg border border-subtle/20 hover:border-accent/50 hover:bg-accent/5 transition-all group"
                >
                  <div className="space-y-2">
                    {/* Title */}
                    <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                      {entry.title}
                    </h3>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-subtle">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{formatAuthors(entry.authors)}</span>
                      </div>

                      {entry.year && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{entry.year}</span>
                        </div>
                      )}

                      {entry.container && (
                        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {entry.container}
                        </div>
                      )}
                    </div>

                    {/* Key */}
                    <div className="text-xs font-mono text-subtle bg-gray-50 px-2 py-1 rounded inline-block">
                      {entry.key}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-subtle/20">
          <div className="text-sm text-subtle">
            {searchResults.length} référence{searchResults.length !== 1 ? 's' : ''} disponible
            {searchResults.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
