'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Flame,
  Clock,
  User,
  ImageIcon,
  Film,
  Music,
  MessageCircle,
  ChevronDown,
  Maximize2,
  X,
  ArrowLeft,
  Search,
  Filter,
  Loader2,
  Upload,
  Plus,
} from 'lucide-react'

interface Archive {
  id: string
  title: string
  slug: string
  description?: string | null
  participants: Array<{
    id: string
    name: string
    messageCount: number
  }>
  stats: {
    totalMessages: number
    participantCount: number
    photos: number
    videos: number
    audio: number
    reactions: number
    startDate?: string
    endDate?: string
  }
}

interface Message {
  id: string
  sender: string
  content: string | null
  timestamp: string
  date: string
  media: Array<{
    id: string
    type: string
    url: string
    thumb?: string | null
    name?: string | null
  }>
  reactions: Array<{
    reaction: string
    actor: string
  }>
}

interface FeuHumainClientProps {
  archiveSlug: string
}

export default function FeuHumainClient({ archiveSlug }: FeuHumainClientProps) {
  const [archive, setArchive] = useState<Archive | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<any>(null)
  const [showStats, setShowStats] = useState(true)

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce de la recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Charger les données initiales
  useEffect(() => {
    const loadArchiveData = async () => {
      try {
        // Charger les infos de l'archive
        const archiveRes = await fetch(`/api/archive/${archiveSlug}`)
        if (!archiveRes.ok) {
          // L'archive n'existe pas encore, c'est normal pour un premier import
          console.log('Archive non trouvée, première utilisation')
          setLoading(false)
          return // Arrêter ici, pas de messages à charger
        }

        const archiveData = await archiveRes.json()
        setArchive(archiveData)

        // Charger les messages initiaux seulement si l'archive existe
        const messagesRes = await fetch(`/api/archive/${archiveSlug}/messages?page=1&limit=50`)
        const messagesData = await messagesRes.json()
        setMessages(messagesData.messages)
        setHasMore(messagesData.pagination.hasNext)
        setPage(1)
      } catch (error) {
        console.error('Erreur chargement:', error)
      } finally {
        setLoading(false)
      }
    }

    loadArchiveData()
  }, [archiveSlug])

  // Recharger quand les filtres changent
  useEffect(() => {
    if (!archive) return

    const loadFilteredMessages = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '50',
          filter: filterType,
          search: debouncedSearch,
        })

        const res = await fetch(`/api/archive/${archiveSlug}/messages?${params}`)
        const data = await res.json()

        setMessages(data.messages)
        setHasMore(data.pagination.hasNext)
        setPage(1)
      } catch (error) {
        console.error('Erreur filtrage:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFilteredMessages()
  }, [filterType, debouncedSearch, archiveSlug, archive])

  // Charger plus de messages
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: '50',
        filter: filterType,
        search: debouncedSearch,
      })

      const res = await fetch(`/api/archive/${archiveSlug}/messages?${params}`)
      const data = await res.json()

      setMessages(prev => [...prev, ...data.messages])
      setHasMore(data.pagination.hasNext)
      setPage(page + 1)
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore, filterType, debouncedSearch, archiveSlug])

  // Observer pour l'infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadMore, loadingMore])

  // Formater la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && !archive) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Flame className="w-16 h-16 text-orange-500 animate-pulse mx-auto mb-4" />
          <p className="text-white text-xl font-light">Chargement de l'archive...</p>
        </div>
      </div>
    )
  }

  if (!archive) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Flame className="w-16 h-16 text-orange-500/50 mx-auto mb-4" />
          <p className="text-red-500 text-xl mb-4">Archive FEU HUMAIN non trouvée</p>
          <p className="text-gray-400 mb-6">
            L'archive n'a pas encore été créée. Importez votre premier fichier pour commencer.
          </p>

          <div className="flex flex-col gap-3 items-center">
            <Link
              href="/admin/feu-humain/import"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition"
            >
              <Plus className="w-5 h-5" />
              Créer l'archive et importer
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'admin
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Header épique */}
      <header className="relative overflow-hidden bg-black border-b border-orange-900/30">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-red-900/20 to-yellow-900/20 animate-pulse"></div>
        <div className="relative z-10 p-8">
          {/* Navigation */}
          <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'admin
            </Link>

            <Link
              href="/admin/feu-humain/import"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition"
            >
              <Upload className="w-4 h-4" />
              Importer des messages
            </Link>
          </div>

          {/* Titre */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Flame className="w-12 h-12 text-orange-500 animate-pulse" />
              <h1 className="text-4xl md:text-6xl font-light mx-4 bg-gradient-to-r from-orange-400 via-red-500 to-yellow-400 bg-clip-text text-transparent">
                {archive.title}
              </h1>
              <Flame className="w-12 h-12 text-orange-500 animate-pulse" />
            </div>
            {archive.description && (
              <p className="text-gray-400 text-lg font-light">{archive.description}</p>
            )}

            {/* Bouton afficher/masquer stats */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition"
            >
              {showStats ? 'Masquer' : 'Afficher'} les statistiques
            </button>

            {/* Statistiques */}
            {showStats && (
              <div className="flex flex-wrap justify-center gap-6 mt-6 animate-fadeIn">
                <div className="text-center">
                  <div className="text-2xl font-light text-orange-400">
                    {archive.stats.totalMessages.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-orange-400">
                    {archive.stats.participantCount}
                  </div>
                  <div className="text-sm text-gray-500">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-orange-400">
                    {archive.stats.photos.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Photos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-orange-400">
                    {archive.stats.videos.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Vidéos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-orange-400">
                    {archive.stats.reactions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Réactions</div>
                </div>
              </div>
            )}

            {/* Période */}
            {archive.stats.startDate && archive.stats.endDate && (
              <div className="mt-4 text-sm text-gray-500">
                Du {formatDate(archive.stats.startDate)} au {formatDate(archive.stats.endDate)}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Filtres et recherche */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Barre de recherche */}
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher dans la conversation..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Filtres */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-light transition ${
                  filterType === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Tout
              </button>
              <button
                onClick={() => setFilterType('text')}
                className={`px-4 py-2 rounded-lg font-light transition ${
                  filterType === 'text'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Texte
              </button>
              <button
                onClick={() => setFilterType('photos')}
                className={`px-4 py-2 rounded-lg font-light transition ${
                  filterType === 'photos'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Photos
              </button>
              <button
                onClick={() => setFilterType('videos')}
                className={`px-4 py-2 rounded-lg font-light transition ${
                  filterType === 'videos'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Film className="w-4 h-4 inline mr-1" />
                Vidéos
              </button>
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-500">
              {messages.length} résultat(s) trouvé(s)
            </div>
          )}
        </div>
      </div>

      {/* Timeline des messages */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                formatDate={formatDate}
                onMediaClick={setSelectedMedia}
              />
            ))}
          </div>
        )}

        {/* Loader pour infinite scroll */}
        {hasMore && !loading && (
          <div ref={loadMoreRef} className="text-center py-8">
            {loadingMore ? (
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
            ) : (
              <>
                <ChevronDown className="w-8 h-8 text-gray-500 animate-bounce mx-auto" />
                <p className="text-gray-500 mt-2 font-light">Chargement de plus de messages...</p>
              </>
            )}
          </div>
        )}

        {/* Message de fin */}
        {!hasMore && messages.length > 0 && (
          <div className="text-center py-12">
            <Flame className="w-12 h-12 text-orange-500/50 mx-auto mb-4" />
            <p className="text-gray-500 font-light">Fin de l'archive</p>
          </div>
        )}
      </div>

      {/* Modal pour média plein écran */}
      {selectedMedia && <MediaModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />}
    </div>
  )
}

// Composant pour afficher un message
function MessageBubble({
  message,
  formatDate,
  onMediaClick,
}: {
  message: Message
  formatDate: (date: string) => string
  onMediaClick: (media: any) => void
}) {
  return (
    <div className="group relative">
      {/* Ligne de temps */}
      <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-orange-600/20 to-transparent"></div>

      {/* Point sur la timeline */}
      <div className="absolute left-7 top-6 w-3 h-3 bg-orange-500 rounded-full ring-4 ring-black"></div>

      {/* Contenu du message */}
      <div className="ml-16 bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800 hover:border-orange-600/50 transition">
        {/* Header du message */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-orange-400" />
            <span className="font-light text-orange-400">{message.sender}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(message.date)}</span>
          </div>
        </div>

        {/* Contenu texte */}
        {message.content && (
          <p className="text-gray-100 mb-3 whitespace-pre-wrap font-light">{message.content}</p>
        )}

        {/* Photos */}
        {message.media.filter(m => m.type === 'photo').length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {message.media
              .filter(m => m.type === 'photo')
              .map(photo => (
                <div
                  key={photo.id}
                  onClick={() => onMediaClick(photo)}
                  className="relative group/photo cursor-pointer overflow-hidden rounded-lg bg-gray-800 aspect-square"
                >
                  <img
                    src={photo.thumb || photo.url}
                    alt=""
                    className="w-full h-full object-cover group-hover/photo:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/30 transition flex items-center justify-center">
                    <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover/photo:opacity-100 transition" />
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Vidéos */}
        {message.media.filter(m => m.type === 'video').length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {message.media
              .filter(m => m.type === 'video')
              .map(video => (
                <div
                  key={video.id}
                  className="relative group/video cursor-pointer overflow-hidden rounded-lg bg-gray-800 p-8 hover:bg-gray-700 transition"
                  onClick={() => onMediaClick(video)}
                >
                  <Film className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-500 mt-2 text-center font-light">
                    {video.name || 'Vidéo'}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* Audio */}
        {message.media.filter(m => m.type === 'audio').length > 0 && (
          <div className="flex gap-2 mb-3">
            {message.media
              .filter(m => m.type === 'audio')
              .map(audio => (
                <div
                  key={audio.id}
                  className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-700 transition"
                  onClick={() => onMediaClick(audio)}
                >
                  <Music className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-light">{audio.name || 'Audio'}</span>
                </div>
              ))}
          </div>
        )}

        {/* Réactions */}
        {message.reactions.length > 0 && (
          <div className="flex gap-1 mt-2">
            {message.reactions.map((reaction, idx) => (
              <span key={idx} className="text-lg" title={reaction.actor}>
                {reaction.reaction}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Modal pour afficher les médias en plein écran
function MediaModal({ media, onClose }: { media: any; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-6xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {media.type === 'photo' && (
          <img src={media.url} alt="" className="max-w-full h-auto rounded-lg" />
        )}
        {media.type === 'video' && (
          <video src={media.url} controls className="max-w-full h-auto rounded-lg" />
        )}
        {media.type === 'audio' && <audio src={media.url} controls className="w-full" />}
      </div>
    </div>
  )
}
