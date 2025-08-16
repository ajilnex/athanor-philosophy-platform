'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, X, Book, Calendar, User } from 'lucide-react'

interface BibliographyItem {
  key: string
  type: string
  title: string
  author?: string[]
  editor?: string[]
  issued?: { 'date-parts': number[][] }
  publisher?: string
  'container-title'?: string
  page?: string
  volume?: string
  issue?: string
  URL?: string
  abstract?: string
}

interface CitationPickerProps {
  isOpen: boolean
  onClose: () => void
  onCitationSelect: (citationKey: string) => void
}

export function CitationPicker({ isOpen, onClose, onCitationSelect }: CitationPickerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [bibliography, setBibliography] = useState<BibliographyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger la bibliographie depuis le fichier public
  useEffect(() => {
    const loadBibliography = async () => {
      try {
        const response = await fetch('/bibliography.json')
        if (!response.ok) {
          throw new Error('Impossible de charger la bibliographie')
        }
        const data = await response.json()
        setBibliography(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Erreur chargement bibliographie:', err)
        setError('Erreur lors du chargement de la bibliographie')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      loadBibliography()
    }
  }, [isOpen])

  // Filtrer les références selon le terme de recherche
  const filteredRefs = useMemo(() => {
    if (!searchTerm.trim()) return bibliography

    const term = searchTerm.toLowerCase()
    return bibliography.filter(item => {
      const title = item.title?.toLowerCase() || ''
      const authors = item.author?.join(' ').toLowerCase() || ''
      const editors = item.editor?.join(' ').toLowerCase() || ''
      const container = item['container-title']?.toLowerCase() || ''
      const key = item.key?.toLowerCase() || ''

      return (
        title.includes(term) ||
        authors.includes(term) ||
        editors.includes(term) ||
        container.includes(term) ||
        key.includes(term)
      )
    })
  }, [bibliography, searchTerm])

  // Formater les noms d'auteurs
  const formatAuthors = (authors?: string[], editors?: string[]) => {
    const names = authors || editors || []
    if (names.length === 0) return 'Auteur inconnu'
    if (names.length === 1) return names[0]
    if (names.length === 2) return `${names[0]} & ${names[1]}`
    return `${names[0]} et al.`
  }

  // Formater la date
  const formatDate = (issued?: { 'date-parts': number[][] }) => {
    if (!issued?.['date-parts']?.[0]?.[0]) return ''
    return issued['date-parts'][0][0].toString()
  }

  // Formater le type de document
  const formatType = (type: string) => {
    const types: Record<string, string> = {
      'article-journal': 'Article',
      book: 'Livre',
      chapter: 'Chapitre',
      'paper-conference': 'Conférence',
      thesis: 'Thèse',
      webpage: 'Page web',
    }
    return types[type] || type
  }

  const handleSelect = (citation: BibliographyItem) => {
    onCitationSelect(citation.key)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Book className="h-5 w-5" />
            Bibliographie Zotero
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, auteur, année..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-3 text-gray-600">Chargement de la bibliographie...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredRefs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm.trim() ? 'Aucune référence trouvée' : 'Bibliographie vide'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRefs.map(ref => (
                <div
                  key={ref.key}
                  onClick={() => handleSelect(ref)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2 leading-snug">{ref.title}</h4>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {formatAuthors(ref.author, ref.editor)}
                        </div>

                        {formatDate(ref.issued) && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(ref.issued)}
                          </div>
                        )}

                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {formatType(ref.type)}
                        </span>
                      </div>

                      {ref['container-title'] && (
                        <p className="text-sm text-gray-500 italic mb-1">
                          {ref['container-title']}
                        </p>
                      )}

                      <p className="text-xs text-gray-400 font-mono">Clé: {ref.key}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-xs text-gray-500">
            Cliquez sur une référence pour l'insérer comme <code>&lt;Cite item="key" /&gt;</code>
          </p>
        </div>
      </div>
    </div>
  )
}
