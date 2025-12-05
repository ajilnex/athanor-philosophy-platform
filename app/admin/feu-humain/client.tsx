'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
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
import { StatsPanel } from '@/lib/archive/feu-humain/components/StatsPanel'
import { MediaGrid } from './components/MediaGrid'
import { WelcomeIntro } from '@/lib/archive/feu-humain/components/WelcomeIntro'

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
    timelineDistribution?: Array<{ date: string; count: number }>
    hourlyDistribution?: Array<{ timestamp: string; count: number; first_msg?: string; last_msg?: string }>
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
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
  const [showStats, setShowStats] = useState(false)
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if user has already seen the welcome screen
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('archive-welcome-dismissed')
    }
    return true
  })

  // Derive current filters from URL or state
  const startDate = searchParams.get('startDate')

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageStreamRef = useRef<HTMLDivElement>(null)
  const isInitialLoadRef = useRef(true) // Prevent loadPrevious during initial/filter load

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

        // Initial load will be handled by the filter effect
      } catch (error) {
        console.error('Erreur chargement:', error)
        setLoading(false)
      }
    }

    loadArchiveData()
  }, [archiveSlug])

  // Recharger quand les filtres ou l'URL changent
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

        if (startDate) {
          params.append('startDate', startDate)
        }

        const res = await fetch(`/api/archive/${archiveSlug}/messages?${params}`)
        const data = await res.json()

        setMessages(data.messages)
        setHasMore(data.pagination.hasNext)
        setPage(1)

        // Scroll to top when filter changes
        if (messageStreamRef.current) {
          messageStreamRef.current.scrollTop = 0
        }

        // Mark initial load as done after a short delay (let the DOM settle)
        isInitialLoadRef.current = true
        setTimeout(() => {
          isInitialLoadRef.current = false
        }, 500)
      } catch (error) {
        console.error('Erreur filtrage:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFilteredMessages()
  }, [filterType, debouncedSearch, archiveSlug, archive, startDate])

  // Charger plus de messages (vers le bas / futur)
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

      if (startDate) {
        params.append('startDate', startDate)
      }

      const res = await fetch(`/api/archive/${archiveSlug}/messages?${params}`)
      const data = await res.json()

      // Deduplicate: filter out any messages already in the list
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const uniqueNewMessages = data.messages.filter((m: Message) => !existingIds.has(m.id))
        return [...prev, ...uniqueNewMessages]
      })
      setHasMore(data.pagination.hasNext)
      setPage(page + 1)
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore, filterType, debouncedSearch, archiveSlug, startDate])

  // Charger les messages précédents (vers le haut / passé)
  const [loadingPrev, setLoadingPrev] = useState(false)
  const [hasPrev, setHasPrev] = useState(true) // Assume true initially if we started from a date
  const loadPrevRef = useRef<HTMLDivElement>(null)

  const loadPrevious = useCallback(async () => {
    if (loadingPrev || messages.length === 0 || !hasPrev) return

    setLoadingPrev(true)
    try {
      const firstMessage = messages[0]
      const params = new URLSearchParams({
        limit: '50',
        filter: filterType,
        search: debouncedSearch,
        // Use timestamp cursor for precise pagination (avoids duplicates)
        beforeTimestamp: firstMessage.timestamp,
        sort: 'desc' // Get the closest ones first (will be reversed)
      })

      const res = await fetch(`/api/archive/${archiveSlug}/messages?${params}`)
      const data = await res.json()

      if (data.messages.length > 0) {
        // Messages come in DESC order (newest to oldest), so we reverse them to be chronological
        const newMessages = [...data.messages].reverse()

        // Get current scroll position to maintain it after prepending
        const scrollContainer = messageStreamRef.current
        const prevScrollHeight = scrollContainer?.scrollHeight || 0

        // Prepend to list (should be no duplicates with cursor-based pagination)
        setMessages(prev => [...newMessages, ...prev])

        // Restore scroll position after React updates the DOM
        requestAnimationFrame(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight
            scrollContainer.scrollTop = newScrollHeight - prevScrollHeight
          }
        })
      } else {
        setHasPrev(false)
      }
    } catch (error) {
      console.error('Erreur chargement précédent:', error)
    } finally {
      setLoadingPrev(false)
    }
  }, [loadingPrev, messages, filterType, debouncedSearch, archiveSlug, hasPrev])

  // Observer for loading PREVIOUS messages (when scrolling up)
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // Don't trigger during initial load or right after filter change
        if (entries[0].isIntersecting && hasPrev && !loadingPrev && messages.length > 0 && !isInitialLoadRef.current) {
          loadPrevious()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    const target = loadPrevRef.current
    if (target) observer.observe(target)

    return () => {
      if (target) observer.unobserve(target)
      observer.disconnect()
    }
  }, [loadPrevious, hasPrev, loadingPrev, messages.length])

  // Observer for loading MORE messages (when scrolling down) 
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    const target = loadMoreRef.current
    if (target) observer.observe(target)

    return () => {
      if (target) observer.unobserve(target)
      observer.disconnect()
    }
  }, [loadMore, hasMore, loadingMore])

  // ... (Refs and Observer remain the same)

  const handleDateSelect = (date: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('startDate', date)
    params.delete('endDate')
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleYearSelect = (year: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (year === 'LATEST') {
      params.delete('startDate')
    } else {
      params.set('startDate', `${year}-01-01`)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const scrollToBottom = () => {
    if (messageStreamRef.current) {
      messageStreamRef.current.scrollTo({
        top: messageStreamRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  const scrollToTop = () => {
    if (messageStreamRef.current) {
      messageStreamRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

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

  if (loading && !archive && !messages.length) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-[var(--text-tertiary)] text-xs">Chargement de l'archive...</p>
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
      {/* Welcome Intro - Shows on first visit */}
      {showWelcome && archive && (
        <WelcomeIntro
          archiveTitle={archive.title}
          messageCount={archive.stats.totalMessages}
          participantCount={archive.stats.participantCount}
          startYear={archive.stats.startDate?.split('-')[0] || '2015'}
          endYear={archive.stats.endDate?.split('-')[0] || '2024'}
          onDismiss={() => {
            setShowWelcome(false)
            localStorage.setItem('archive-welcome-dismissed', 'true')
          }}
        />
      )}

      {/* Header */}
      <header className="h-16 glass-header flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--accent)] transition rounded-full hover:bg-[var(--elevated)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-medium tracking-wide text-[var(--text-bright)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-dim)] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-[var(--accent)]" />
              </div>
              {archive.title}
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5 pl-11">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              ARCHIVE ACTIVE {startDate ? `· ${startDate.split('-')[0]}` : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-56 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-lg pl-9 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-ghost)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-dim)] transition"
            />
          </div>

          <div className="h-6 w-px bg-[var(--border-default)] hidden md:block" />

          {/* Filters */}
          <div className="flex gap-1.5">
            <FilterButton
              active={filterType === 'all'}
              onClick={() => setFilterType('all')}
              label="Tout"
            />
            <FilterButton
              active={filterType === 'photos'}
              onClick={() => setFilterType('photos')}
              label="Photos"
              icon={<ImageIcon className="w-3.5 h-3.5" />}
            />
            <FilterButton
              active={filterType === 'videos'}
              onClick={() => setFilterType('videos')}
              label="Vidéos"
              icon={<Film className="w-3.5 h-3.5" />}
            />
          </div>

          <div className="h-6 w-px bg-[var(--border-default)]" />

          <button
            onClick={() => setShowStats(!showStats)}
            className={`p-2.5 transition rounded-lg ${showStats
              ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
              : 'text-[var(--text-tertiary)] hover:bg-[var(--elevated)] hover:text-[var(--text-primary)]'
              }`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Timeline Sidebar */}
        <TimelineSidebar
          className="shrink-0 z-40 hidden md:flex"
          onYearSelect={handleYearSelect}
          onDateSelect={handleDateSelect}
          distribution={archive?.stats.timelineDistribution}
          hourlyDistribution={archive?.stats.hourlyDistribution}
        />

        {/* Stats Side Panel - Slides in from right, below archive header */}
        <aside
          className={`fixed top-16 right-0 bottom-0 w-80 bg-[var(--abyss)] border-l border-[var(--border-subtle)] z-40 transform transition-transform duration-300 ease-out overflow-y-auto ${showStats ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
          {archive && (
            <>
              {/* Header */}
              <div className="sticky top-0 bg-[var(--abyss)] z-10 p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <h2 className="text-sm font-medium text-[var(--text-primary)]">
                  Statistiques
                </h2>
                <button
                  onClick={() => setShowStats(false)}
                  className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition rounded-lg hover:bg-[var(--elevated)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Title */}
                <div>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Archive</p>
                  <p className="text-sm text-[var(--text-primary)] font-medium">{archive.title}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="stat-card">
                    <p className="hud-label">Messages</p>
                    <p className="text-xl hud-value">{archive.stats.totalMessages.toLocaleString()}</p>
                  </div>
                  <div className="stat-card">
                    <p className="hud-label">Photos</p>
                    <p className="text-xl hud-value">{archive.stats.photos.toLocaleString()}</p>
                  </div>
                  <div className="stat-card">
                    <p className="hud-label">Vidéos</p>
                    <p className="text-xl hud-value">{archive.stats.videos.toLocaleString()}</p>
                  </div>
                  <div className="stat-card">
                    <p className="hud-label">Audio</p>
                    <p className="text-xl hud-value">{archive.stats.audio.toLocaleString()}</p>
                  </div>
                </div>

                {/* Date Range */}
                {archive.stats.startDate && archive.stats.endDate && (
                  <div className="stat-card">
                    <p className="hud-label mb-2">Période</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {new Date(archive.stats.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[var(--text-ghost)] text-xs my-1">→</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {new Date(archive.stats.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}

                {/* Description */}
                {archive.description && (
                  <div className="stat-card">
                    <p className="hud-label mb-2">Description</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{archive.description}</p>
                  </div>
                )}

                {/* Participants */}
                {archive.participants && archive.participants.length > 0 && (
                  <div className="stat-card">
                    <p className="hud-label mb-3">Participants ({archive.participants.length})</p>
                    <div className="space-y-2">
                      {archive.participants.map((p: { id: string; name: string; messageCount: number }) => (
                        <div key={p.id} className="flex items-center justify-between">
                          <span className="text-sm text-[var(--text-secondary)] truncate max-w-[160px]">{p.name}</span>
                          <span className="text-xs text-[var(--accent)] font-mono ml-2">{p.messageCount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>


        {/* Message Stream */}
        <main
          className={`flex-1 overflow-y-auto relative scroll-smooth transition-all duration-300 ${showStats ? 'mr-80' : ''}`}
          id="message-stream"
          ref={messageStreamRef}
        >
          <div className="max-w-4xl mx-auto px-4 py-8 min-h-full">
            <div className="space-y-1">
              {/* Auto-load trigger for PREVIOUS messages */}
              {hasPrev && messages.length > 0 && (
                <div ref={loadPrevRef} className="py-4 flex justify-center">
                  {loadingPrev && (
                    <div className="flex items-center gap-2 text-[#00f0ff]/50 font-mono text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      LOADING_HISTORY...
                    </div>
                  )}
                </div>
              )}

              {!hasPrev && messages.length > 0 && (
                <div className="py-8 text-center">
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-[#00f0ff]/20 to-transparent mb-4" />
                  <p className="text-xs font-mono text-[#00f0ff]/40">BEGINNING OF ARCHIVE</p>
                </div>
              )}

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

            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-32 text-center animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-[#00f0ff]/5 flex items-center justify-center mb-4 border border-[#00f0ff]/20">
                  <Search className="w-8 h-8 text-[#00f0ff]/40" />
                </div>
                <h3 className="text-sm font-mono text-[#00f0ff] mb-2">NO DATA FOUND</h3>
                <p className="text-xs text-white/40 font-mono max-w-xs">
                  No records found for this temporal sector. Try adjusting your filters.
                </p>
              </div>
            )}
          </div>

          {/* Scroll Controls */}
          <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
            <button
              onClick={scrollToTop}
              className="p-3 bg-black/50 backdrop-blur border border-[#00f0ff]/20 rounded-full text-[#00f0ff]/50 hover:text-[#00f0ff] hover:border-[#00f0ff] transition shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 rotate-90" />
            </button>
            <button
              onClick={scrollToBottom}
              className="p-3 bg-black/50 backdrop-blur border border-[#00f0ff]/20 rounded-full text-[#00f0ff]/50 hover:text-[#00f0ff] hover:border-[#00f0ff] transition shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </main>
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${active
        ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]'
        : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--elevated)] hover:border-[var(--border-default)]'
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
        <div className="flex items-baseline gap-3 mb-1.5 px-4">
          <span
            className={`text-sm font-medium ${isMe ? 'text-[var(--accent)]' : 'text-[var(--warm)]'}`}
          >
            {message.sender}
          </span>
          <span className="text-xs text-[var(--text-ghost)]">{formatDate(message.date)}</span>
        </div>
      )}

      <div
        className={`message-block px-4 py-1.5 transition-colors ${showHeader ? 'border-l-2 border-[var(--border-subtle)]' : 'border-l-2 border-transparent ml-[2px]'}`}
      >
        {/* Text Content */}
        {message.content && (
          <div className="message-content text-[var(--text-primary)] leading-relaxed max-w-3xl">
            {message.content}
          </div>
        )}

        {/* Media Grid */}
        <MediaGrid media={message.media} onMediaClick={onMediaClick} />

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {message.reactions.map((r: any, i: number) => (
              <span
                key={i}
                className="text-xs bg-[var(--elevated)] px-2 py-0.5 rounded text-[var(--text-secondary)] border border-[var(--border-subtle)]"
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
      className="fixed inset-0 z-[100] bg-[var(--void)]/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-[var(--surface)] hover:bg-[var(--accent-dim)] border border-[var(--border-default)] hover:border-[var(--accent)] rounded-full transition group z-[110]"
        aria-label="Fermer"
      >
        <X className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[var(--accent)]" />
      </button>

      <div
        className="max-w-7xl max-h-[90vh] w-full flex items-center justify-center"
      >
        <div
          className="relative border border-[var(--border-accent)] bg-[var(--abyss)] p-1 rounded-lg shadow-[0_0_50px_var(--accent-dim)]"
          onClick={e => e.stopPropagation()}
        >
          {media.type === 'photo' && (
            <img src={media.url} alt="" className="max-h-[85vh] max-w-full rounded" />
          )}
          {media.type === 'video' && (
            <video src={media.url} controls autoPlay className="max-h-[85vh] max-w-full rounded" />
          )}
          {media.type === 'audio' && (
            <div className="bg-[var(--surface)] p-12 w-full max-w-md flex flex-col items-center gap-6 rounded">
              <Music className="w-16 h-16 text-[var(--accent)]" />
              <audio src={media.url} controls className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
