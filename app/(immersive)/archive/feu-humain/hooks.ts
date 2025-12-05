// Hooks personnalisés pour l'archive FEU HUMAIN

import { useState, useEffect, useCallback, useMemo } from 'react'
import { archiveConfig } from './config'

// Types
interface FavoriteMessage {
  timestamp: number
  sender: string
  content: string
  addedAt: number
}

interface SearchResult {
  message: any
  matchedField: 'content' | 'sender' | 'date'
  matchScore: number
}

/**
 * Hook pour gérer les messages favoris
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Map<number, FavoriteMessage>>(new Map())
  const storageKey = archiveConfig.features.favorites.storageKey

  // Charger les favoris depuis le localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setFavorites(new Map(parsed))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error)
    }
  }, [storageKey])

  // Sauvegarder les favoris
  const saveFavorites = useCallback(
    (newFavorites: Map<number, FavoriteMessage>) => {
      if (typeof window === 'undefined') return

      try {
        const toSave = Array.from(newFavorites.entries())
        localStorage.setItem(storageKey, JSON.stringify(toSave))
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des favoris:', error)
      }
    },
    [storageKey]
  )

  // Ajouter un favori
  const addFavorite = useCallback(
    (message: any) => {
      setFavorites(prev => {
        const newFavorites = new Map(prev)

        // Vérifier la limite
        if (newFavorites.size >= archiveConfig.features.favorites.maxFavorites) {
          // Supprimer le plus ancien
          const oldest = Array.from(newFavorites.entries()).sort(
            (a, b) => a[1].addedAt - b[1].addedAt
          )[0]
          if (oldest) {
            newFavorites.delete(oldest[0])
          }
        }

        newFavorites.set(message.timestamp_ms, {
          timestamp: message.timestamp_ms,
          sender: message.sender_name,
          content: message.content || '[Média]',
          addedAt: Date.now(),
        })

        saveFavorites(newFavorites)
        return newFavorites
      })
    },
    [saveFavorites]
  )

  // Retirer un favori
  const removeFavorite = useCallback(
    (timestamp: number) => {
      setFavorites(prev => {
        const newFavorites = new Map(prev)
        newFavorites.delete(timestamp)
        saveFavorites(newFavorites)
        return newFavorites
      })
    },
    [saveFavorites]
  )

  // Vérifier si un message est en favori
  const isFavorite = useCallback(
    (timestamp: number) => {
      return favorites.has(timestamp)
    },
    [favorites]
  )

  // Effacer tous les favoris
  const clearFavorites = useCallback(() => {
    setFavorites(new Map())
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  return {
    favorites: Array.from(favorites.values()),
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites,
    count: favorites.size,
  }
}

/**
 * Hook pour la recherche avancée
 */
export function useSearch(messages: any[], searchTerm: string) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)

    // Débounce
    const timer = setTimeout(() => {
      const searchLower = searchTerm.toLowerCase()
      const searchResults: SearchResult[] = []

      messages.forEach(message => {
        let matchScore = 0
        let matchedField: 'content' | 'sender' | 'date' | null = null

        // Recherche dans le contenu
        if (message.content && message.content.toLowerCase().includes(searchLower)) {
          matchScore = 3
          matchedField = 'content'
        }
        // Recherche dans le nom de l'expéditeur
        else if (message.sender_name && message.sender_name.toLowerCase().includes(searchLower)) {
          matchScore = 2
          matchedField = 'sender'
        }
        // Recherche dans la date (format texte)
        else {
          const dateStr = new Date(message.timestamp_ms).toLocaleDateString('fr-FR')
          if (dateStr.includes(searchTerm)) {
            matchScore = 1
            matchedField = 'date'
          }
        }

        if (matchedField) {
          searchResults.push({
            message,
            matchedField,
            matchScore,
          })
        }
      })

      // Trier par score de pertinence
      searchResults.sort((a, b) => b.matchScore - a.matchScore)

      setResults(searchResults)
      setIsSearching(false)
    }, archiveConfig.performance.debounceSearch)

    return () => clearTimeout(timer)
  }, [messages, searchTerm])

  return {
    results,
    isSearching,
    resultCount: results.length,
  }
}

/**
 * Hook pour les statistiques avancées
 */
export function useStatistics(messages: any[]) {
  const stats = useMemo(() => {
    if (!messages || messages.length === 0) {
      return null
    }

    // Statistiques de base
    const totalMessages = messages.length
    const uniqueSenders = new Set(messages.map(m => m.sender_name)).size

    // Messages par jour de la semaine
    const messagesByDayOfWeek = new Array(7).fill(0)
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

    // Messages par heure
    const messagesByHour = new Array(24).fill(0)

    // Top mots utilisés
    const wordFrequency = new Map<string, number>()

    // Emojis les plus utilisés
    const emojiFrequency = new Map<string, number>()
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu

    messages.forEach(message => {
      // Jour de la semaine
      const date = new Date(message.timestamp_ms)
      messagesByDayOfWeek[date.getDay()]++

      // Heure
      messagesByHour[date.getHours()]++

      // Analyse du contenu
      if (message.content) {
        // Mots
        const words = message.content.toLowerCase().split(/\s+/)
        words.forEach((word: string) => {
          if (word.length > 4) {
            // Ignorer les mots trop courts
            wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1)
          }
        })

        // Emojis
        const emojis = message.content.match(emojiRegex)
        if (emojis) {
          emojis.forEach((emoji: string) => {
            emojiFrequency.set(emoji, (emojiFrequency.get(emoji) || 0) + 1)
          })
        }
      }
    })

    // Top 10 mots
    const topWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Top 10 emojis
    const topEmojis = Array.from(emojiFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // Jour le plus actif
    const mostActiveDay = messagesByDayOfWeek.indexOf(Math.max(...messagesByDayOfWeek))

    // Heure la plus active
    const mostActiveHour = messagesByHour.indexOf(Math.max(...messagesByHour))

    return {
      totalMessages,
      uniqueSenders,
      messagesByDayOfWeek: messagesByDayOfWeek.map((count, index) => ({
        day: dayNames[index],
        count,
      })),
      messagesByHour,
      topWords,
      topEmojis,
      mostActiveDay: dayNames[mostActiveDay],
      mostActiveHour: `${mostActiveHour}h00`,
      averageMessagesPerDay: Math.round(totalMessages / 365), // Approximation
    }
  }, [messages])

  return stats
}

/**
 * Hook pour la pagination virtuelle
 */
export function useVirtualScroll(items: any[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight)

    return {
      start: Math.max(0, startIndex - 5), // Buffer de 5 éléments
      end: Math.min(items.length, endIndex + 5),
    }
  }, [scrollTop, itemHeight, containerHeight, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  }
}

/**
 * Hook pour gérer le thème
 */
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    // Charger le thème sauvegardé
    const saved = localStorage.getItem('feu-humain-theme')
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('feu-humain-theme', newTheme)
      return newTheme
    })
  }, [])

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  }
}

/**
 * Hook pour gérer les raccourcis clavier
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const ctrl = event.ctrlKey || event.metaKey
      const shift = event.shiftKey
      const alt = event.altKey

      // Construire la clé de raccourci
      let shortcutKey = ''
      if (ctrl) shortcutKey += 'ctrl+'
      if (shift) shortcutKey += 'shift+'
      if (alt) shortcutKey += 'alt+'
      shortcutKey += key

      // Exécuter l'action si elle existe
      if (shortcuts[shortcutKey]) {
        event.preventDefault()
        shortcuts[shortcutKey]()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
