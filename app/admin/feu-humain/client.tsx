'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  ImageIcon,
  Film,
  Music,
  Maximize2,
  X,
  MoreHorizontal,
  Download,
  Share2,
  Info,
  Terminal,
} from 'lucide-react'
import { GlassDashboard } from './components/GlassDashboard'
import { TimelineSidebar } from './components/TimelineSidebar'
import { StatsPanel } from './components/StatsPanel'

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
  const router = useRouter()
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
        const archiveRes = await fetch(`/api/archive/${archiveSlug}`)
        if (!archiveRes.ok) {
          setLoading(false)
          return
        }

        const archiveData = await archiveRes.json()
        setArchive(archiveData)

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

  // Refs pour l'état de l'infinite scroll
  const loadingMoreRefState = useRef(loadingMore)
  const hasMoreRefState = useRef(hasMore)

  useEffect(() => {
    loadingMoreRefState.current = loadingMore
  }, [loadingMore])

  useEffect(() => {
    hasMoreRefState.current = hasMore
  }, [hasMore])

  // Observer pour l'infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0]
        if (target.isIntersecting && hasMoreRefState.current && !loadingMoreRefState.current) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px',
      }
    )

    const currentTarget = loadMoreRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
      observer.disconnect()
    }
  }, [loadMore])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && !archive) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#00f0ff] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-[#00f0ff] text-xs animate-pulse">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    )
  }

  if (!archive) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <p className="text-xl font-light text-white/50">ARCHIVE NOT FOUND</p>
          <Link
            href="/admin/feu-humain/import"
            className="inline-block px-6 py-2 border border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff]/10 transition font-mono text-sm"
          >
            INITIATE IMPORT SEQUENCE
          </Link>
        </div>
      </div>
    )
  }

  return (
    <GlassDashboard>
      {/* Header */}
      <header className="h-16 glass-header flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="p-2 -ml-2 text-white/50 hover:text-[#00f0ff] transition rounded-full hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-mono tracking-wider text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#00f0ff]" />
              {archive.title.toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#00f0ff]/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
              SYSTEM ONLINE
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#00f0ff]/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="SEARCH_DATABASE..."
              className="w-full bg-black/40 border border-[rgba(255,255,255,0.1)] rounded-sm pl-8 pr-4 py-1.5 text-xs font-mono text-[#00f0ff] placeholder-[#00f0ff]/30 focus:outline-none focus:border-[#00f0ff]/50 transition"
            />
          </div>

          <div className="h-6 w-px bg-white/10" />

          {/* Filters */}
          <div className="flex gap-2">
            <FilterButton
              active={filterType === 'all'}
              onClick={() => setFilterType('all')}
              label="ALL"
            />
            <FilterButton
              active={filterType === 'photos'}
              onClick={() => setFilterType('photos')}
              label="IMG"
              icon={<ImageIcon className="w-3 h-3" />}
            />
            <FilterButton
              active={filterType === 'videos'}
              onClick={() => setFilterType('videos')}
              label="VID"
              icon={<Film className="w-3 h-3" />}
            />
          </div>

          <div className="h-6 w-px bg-white/10" />

          <button
            onClick={() => setShowStats(!showStats)}
            className={`p-2 transition rounded hover:bg-white/5 ${showStats ? 'text-[#00f0ff]' : 'text-white/50'}`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Timeline Sidebar */}
        <TimelineSidebar className="shrink-0 z-40 hidden md:flex" />

        {/* Message Stream */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth" id="message-stream">
          <div className="max-w-4xl mx-auto px-4 py-8 min-h-full">
            <div className="space-y-1">
              {messages.map((message, index) => {
                const prevMessage = messages[index - 1]
                const showHeader =
                  !prevMessage ||
                  prevMessage.sender !== message.sender ||
                  new Date(message.date).getTime() - new Date(prevMessage.date).getTime() > 3600000

                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    showHeader={showHeader}
                    formatDate={formatDate}
                    onMediaClick={setSelectedMedia}
                  />
                )
              })}
            </div>

            {/* Loading State */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-12 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-2 text-[#00f0ff] font-mono text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    LOADING_DATA_CHUNKS...
                  </div>
                )}
              </div>
            )}

            {!hasMore && messages.length > 0 && (
              <div className="py-20 text-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00f0ff]/20 to-transparent mb-4" />
                <p className="text-xs font-mono text-[#00f0ff]/40">END OF ARCHIVE</p>
              </div>
            )}
          </div>
        </main>

        {/* Stats Panel (Overlay or Sidebar) */}
        {showStats && (
          <div className="w-80 shrink-0 border-l border-[rgba(255,255,255,0.08)] bg-[rgba(5,5,5,0.4)] backdrop-blur-sm p-6 hidden lg:block animate-slideInRight">
            <StatsPanel stats={archive.stats} />

            <div className="mt-8">
              <h3 className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest mb-4 border-b border-[rgba(255,255,255,0.1)] pb-2">
                Archive Metadata
              </h3>
              <p className="text-xs text-white/60 leading-relaxed font-mono">
                {archive.description || 'No description available for this archive sequence.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Media Modal */}
      {selectedMedia && <MediaModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />}
    </GlassDashboard>
  )
}

function FilterButton({ active, onClick, label, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1 rounded-sm text-[10px] font-mono transition border ${
        active
          ? 'bg-[#00f0ff]/10 border-[#00f0ff] text-[#00f0ff]'
          : 'bg-transparent border-transparent text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function MessageItem({ message, showHeader, formatDate, onMediaClick }: any) {
  const isMe = message.sender === 'Aubin Robert'

  return (
    <div className={`group animate-fadeIn ${showHeader ? 'mt-6' : 'mt-0.5'}`}>
      {showHeader && (
        <div className="flex items-baseline gap-3 mb-1 px-4 opacity-70 group-hover:opacity-100 transition-opacity">
          <span
            className={`text-xs font-mono font-bold ${isMe ? 'text-[#00f0ff]' : 'text-[#ff003c]'}`}
          >
            {isMe ? '>>' : '<<'} {message.sender.toUpperCase()}
          </span>
          <span className="text-[10px] font-mono text-white/30">{formatDate(message.date)}</span>
        </div>
      )}

      <div
        className={`message-block px-4 py-1 hover:bg-white/5 ${showHeader ? 'border-l-2 border-white/10' : 'border-l-2 border-transparent ml-[2px]'}`}
      >
        {/* Text Content */}
        {message.content && (
          <div className="message-content text-white/80 font-light leading-relaxed max-w-3xl">
            {message.content}
          </div>
        )}

        {/* Media Grid */}
        {message.media.length > 0 && (
          <div
            className={`grid gap-2 mt-3 ${
              message.media.length === 1
                ? 'grid-cols-1 max-w-sm'
                : message.media.length === 2
                  ? 'grid-cols-2 max-w-md'
                  : 'grid-cols-3 max-w-xl'
            }`}
          >
            {message.media.map((media: any) => (
              <div
                key={media.id}
                onClick={() => onMediaClick(media)}
                className="media-grid-item aspect-square bg-black/40 cursor-pointer group/media"
              >
                {media.type === 'photo' ? (
                  <>
                    <Image
                      src={media.thumb || media.url}
                      alt="Media"
                      fill
                      className="object-cover opacity-80 group-hover/media:opacity-100 transition-opacity"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-[#00f0ff]/10 opacity-0 group-hover/media:opacity-100 transition-opacity" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center border border-white/10 group-hover/media:border-[#00f0ff]/50 transition-colors">
                    {media.type === 'video' ? (
                      <Film className="w-8 h-8 text-white/30 group-hover/media:text-[#00f0ff]" />
                    ) : (
                      <Music className="w-8 h-8 text-white/30 group-hover/media:text-[#00f0ff]" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex gap-2 mt-2">
            {message.reactions.map((r: any, i: number) => (
              <span
                key={i}
                className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/50"
                title={r.actor}
              >
                {r.reaction}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MediaModal({ media, onClose }: any) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition group"
      >
        <X className="w-6 h-6 text-white/50 group-hover:text-[#00f0ff]" />
      </button>

      <div
        className="max-w-7xl max-h-[90vh] w-full flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative border border-[#00f0ff]/20 bg-black/50 p-1 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
          {/* Tech Corners */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t border-l border-[#00f0ff]" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t border-r border-[#00f0ff]" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b border-l border-[#00f0ff]" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b border-r border-[#00f0ff]" />

          {media.type === 'photo' && (
            <img src={media.url} alt="" className="max-h-[85vh] max-w-full" />
          )}
          {media.type === 'video' && (
            <video src={media.url} controls autoPlay className="max-h-[85vh] max-w-full" />
          )}
          {media.type === 'audio' && (
            <div className="bg-white/5 p-12 w-full max-w-md flex flex-col items-center gap-6">
              <Music className="w-16 h-16 text-[#00f0ff]" />
              <audio src={media.url} controls className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
