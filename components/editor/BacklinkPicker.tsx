'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, ArrowDown, ArrowUp, X } from 'lucide-react'
import useSWR from 'swr'

interface BilletItem {
  slug: string
  title: string
  date: string
}

interface BacklinkPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (slug: string, alias?: string) => void
  onCreateNew?: (query: string, alias?: string) => void
  initialQuery?: string
  selectedText?: string
}

// Fetcher function pour SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

export function BacklinkPicker({
  isOpen,
  onClose,
  onSelect,
  onCreateNew,
  initialQuery = '',
  selectedText = '',
}: BacklinkPickerProps) {
  const [query, setQuery] = useState(initialQuery)
  const [alias, setAlias] = useState(selectedText)
  const [filteredBillets, setFilteredBillets] = useState<BilletItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Utilisation de SWR pour le data fetching
  const {
    data: billets,
    error,
    isLoading,
  } = useSWR<BilletItem[]>(isOpen ? '/api/billets/list' : null, fetcher)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const aliasInputRef = useRef<HTMLInputElement>(null)

  // Les billets sont maintenant chargés automatiquement par SWR

  // Filtrer les billets avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!billets) {
        setFilteredBillets([])
        return
      }

      if (!query.trim()) {
        setFilteredBillets(billets.slice(0, 10)) // Limiter à 10 résultats si pas de recherche
        setSelectedIndex(0)
        return
      }

      const searchTerm = query.toLowerCase()
      const filtered = billets
        .filter(
          billet =>
            billet.title.toLowerCase().includes(searchTerm) ||
            billet.slug.toLowerCase().includes(searchTerm)
        )
        .slice(0, 10)

      setFilteredBillets(filtered)
      setSelectedIndex(0)
    }, 250) // Debounce de 250ms

    return () => clearTimeout(timeoutId)
  }, [query, billets])

  // Focus et initialisation
  useEffect(() => {
    if (isOpen) {
      // Focus sur le champ de recherche
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)

      // Préremplir l'alias si du texte était sélectionné
      if (selectedText) {
        setAlias(selectedText)
      }
    } else {
      // Reset des états
      setQuery(initialQuery)
      setAlias(selectedText)
      setSelectedIndex(0)
      // Note: error state est maintenant géré par SWR
    }
  }, [isOpen, initialQuery, selectedText])

  // Fonction de sélection
  const handleSelect = useCallback(() => {
    if (selectedIndex < filteredBillets.length) {
      // Sélection d'un billet existant
      const selectedBillet = filteredBillets[selectedIndex]
      onSelect(selectedBillet.slug, alias.trim() || undefined)
    } else if (selectedIndex === filteredBillets.length && query.trim()) {
      // Création d'un nouveau billet
      if (onCreateNew) {
        onCreateNew(query.trim(), alias.trim() || undefined)
      }
    }
    onClose()
  }, [selectedIndex, filteredBillets, onSelect, alias, query, onCreateNew, onClose])

  // Navigation clavier
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Navigation uniquement si on est sur le champ de recherche
      if (document.activeElement === searchInputRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex(
            prev => Math.min(prev + 1, filteredBillets.length) // +1 pour inclure "Nouveau billet"
          )
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          handleSelect()
        } else if (e.key === 'Tab') {
          e.preventDefault()
          // Tab pour passer au champ alias
          aliasInputRef.current?.focus()
        }
      } else if (document.activeElement === aliasInputRef.current) {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleSelect()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredBillets.length, selectedIndex, handleSelect, onClose])

  const handleBilletClick = (billet: BilletItem) => {
    onSelect(billet.slug, alias.trim() || undefined)
    onClose()
  }

  const handleCreateNewClick = () => {
    if (onCreateNew && query.trim()) {
      onCreateNew(query.trim(), alias.trim() || undefined)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Insérer un backlink</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1" type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un billet par titre ou slug..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Alias Input */}
        <div className="p-4 border-b">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texte affiché (alias) - optionnel
          </label>
          <input
            ref={aliasInputRef}
            type="text"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            placeholder="Laissez vide pour utiliser le titre du billet"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">Chargement des billets...</div>
          )}

          {error && (
            <div className="p-4 text-center text-red-600">
              {error instanceof Error ? error.message : 'Erreur lors du chargement des billets'}
            </div>
          )}

          {!isLoading && !error && filteredBillets.length === 0 && !query.trim() && (
            <div className="p-4 text-center text-gray-500">Tapez pour rechercher un billet</div>
          )}

          {!isLoading && !error && filteredBillets.length === 0 && query.trim() && (
            <div className="p-4 text-center text-gray-500">Aucun billet trouvé pour "{query}"</div>
          )}

          {!isLoading && !error && (
            <>
              {/* Billets existants */}
              {filteredBillets.map((billet, index) => (
                <button
                  key={billet.slug}
                  onClick={() => handleBilletClick(billet)}
                  className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                    selectedIndex === index ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  type="button"
                >
                  <div className="font-medium text-gray-900">{billet.title}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {billet.slug} • {billet.date}
                  </div>
                </button>
              ))}

              {/* Option "Nouveau billet" */}
              {query.trim() && onCreateNew && (
                <button
                  onClick={handleCreateNewClick}
                  className={`w-full text-left p-3 hover:bg-green-50 border-b border-gray-100 transition-colors ${
                    selectedIndex === filteredBillets.length ? 'bg-green-50 border-green-200' : ''
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2 font-medium text-green-700">
                    <Plus className="h-4 w-4" />
                    Nouveau billet "{query}"
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Créer un nouveau billet avec ce titre
                  </div>
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer avec instructions */}
        <div className="p-3 bg-gray-50 text-xs text-gray-600 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" />
                Navigation
              </span>
              <span>↵ Sélectionner</span>
              <span>Tab Alias</span>
            </div>
            <span>Échap Fermer</span>
          </div>
        </div>
      </div>
    </div>
  )
}
