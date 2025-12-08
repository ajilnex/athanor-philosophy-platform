'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import {
  Search,
  Loader2,
  ArrowLeft,
  ImageIcon,
  Film,
  Music,
  X,
  Info,
  Terminal,
  Sparkles,
} from 'lucide-react'
import { GlassDashboard } from './components/GlassDashboard'
import { TimelineSidebar } from './components/TimelineSidebar'
import { MediaGrid } from './components/MediaGrid'
import { ArchiveGraph } from '@/components/graph/ArchiveGraph'
import { StackedNotes, getGrapheuNoteContent } from '@/components/graph/StackedNotes'

interface Archive {
  id: string
  title: string
  slug: string
  description?: string | null
  participants: Array<{
    id: string
    name: string
    messageCount: number
    firstActivity?: string | null
    lastActivity?: string | null
  }>
  departedParticipants?: Array<{
    id: string
    name: string
    messageCount: number
    firstActivity?: string | null
    lastActivity?: string | null
    isDeparted: boolean
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
  const [showGrapheu, setShowGrapheu] = useState(false)
  const [openNotes, setOpenNotes] = useState<string[]>([]) // Array of note IDs for stacked notes
  const [focusedNoteIndex, setFocusedNoteIndex] = useState<number>(-1) // Which note is currently expanded
  const [filterBySender, setFilterBySender] = useState<string | null>(null)

  // Stacked notes management
  const openNote = useCallback((noteId: string) => {
    setOpenNotes(prev => {
      // If already open, just focus it
      const existingIndex = prev.indexOf(noteId)
      if (existingIndex !== -1) {
        setFocusedNoteIndex(existingIndex)
        return prev
      }
      // Add new note and focus it
      const newNotes = [...prev, noteId]
      setFocusedNoteIndex(newNotes.length - 1)
      return newNotes
    })
  }, [])

  const closeNote = useCallback((noteId: string) => {
    setOpenNotes(prev => {
      const newNotes = prev.filter(id => id !== noteId)
      // Adjust focus if needed
      setFocusedNoteIndex(current => Math.min(current, newNotes.length - 1))
      return newNotes
    })
  }, [])

  // Focus navigation (doesn't remove notes, just changes which is expanded)
  const focusPreviousNote = useCallback(() => {
    setFocusedNoteIndex(prev => Math.max(0, prev - 1))
  }, [])

  const focusNextNote = useCallback(() => {
    setFocusedNoteIndex(prev => Math.min(openNotes.length - 1, prev + 1))
  }, [openNotes.length])

  const focusNoteAt = useCallback((index: number) => {
    setFocusedNoteIndex(Math.max(0, Math.min(index, openNotes.length - 1)))
  }, [openNotes.length])

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
        } else if (!debouncedSearch && !filterBySender && filterType === 'all') {
          // No filters: load from beginning to show intro
          params.append('fromBeginning', 'true')
        }

        if (filterBySender) {
          params.append('sender', filterBySender)
        }

        const res = await fetch(`/api/archive/${archiveSlug}/messages?${params}`)
        const data = await res.json()

        setMessages(data.messages)
        setHasMore(data.pagination.hasNext)
        // hasPrev is true if we navigated to a specific date (not at the beginning)
        setHasPrev(startDate ? true : (data.pagination.hasPrev || false))
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
  }, [filterType, debouncedSearch, archiveSlug, archive, startDate, filterBySender])

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
  const [hasPrev, setHasPrev] = useState(() => !!searchParams.get('startDate')) // Only true if started from a specific date
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
          <button
            onClick={() => setShowGrapheu(true)}
            className="p-2.5 transition rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--warm-dim)] hover:text-[var(--warm)] flex items-center gap-1.5"
            title="Ouvrir Grapheu"
          >
            <Sparkles className="w-4 h-4" />
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

                {/* Participants - clickable to filter */}
                {archive.participants && archive.participants.length > 0 && (
                  <div className="stat-card">
                    <div className="flex items-center justify-between mb-3">
                      <p className="hud-label">Participants ({archive.participants.length})</p>
                      {filterBySender && (
                        <button
                          onClick={() => setFilterBySender(null)}
                          className="text-[10px] text-[var(--warm)] hover:text-[var(--accent)] transition"
                        >
                          Effacer filtre
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {[
                        ...archive.participants.map((p: any) => ({ ...p })),
                        ...(archive.departedParticipants || []).map((p: any) => ({ ...p }))
                      ].sort((a, b) => (b.messageCount + (b.reactionCount || 0)) - (a.messageCount + (a.reactionCount || 0))).map((p: { id: string; name: string; messageCount: number; reactionCount?: number; isDeparted?: boolean; lastActivity?: string | null }) => {
                        const departDate = p.isDeparted && p.lastActivity
                          ? new Date(p.lastActivity).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                          : null
                        const totalActivity = p.messageCount + (p.reactionCount || 0)
                        return (
                          <button
                            key={p.id}
                            onClick={() => setFilterBySender(filterBySender === p.name ? null : p.name)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition text-left ${filterBySender === p.name
                              ? p.isDeparted
                                ? 'bg-[var(--warm-dim)] border border-[var(--warm)]'
                                : 'bg-[var(--accent-dim)] border border-[var(--accent)]'
                              : 'hover:bg-[var(--abyss)] border border-transparent'
                              }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className={`text-sm truncate max-w-[140px] ${filterBySender === p.name
                                ? p.isDeparted ? 'text-[var(--warm)] font-medium' : 'text-[var(--accent)] font-medium'
                                : p.isDeparted ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'
                                }`}>
                                {p.name}
                              </span>
                              {departDate && (
                                <span className="text-[10px] text-[var(--text-ghost)]">
                                  Parti en {departDate}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-xs font-mono ${p.isDeparted ? 'text-[var(--text-ghost)]' : 'text-[var(--accent)]'}`}>
                                {totalActivity.toLocaleString()}
                              </span>
                              {p.reactionCount && p.reactionCount > 0 && (
                                <span className="text-[9px] text-[var(--text-ghost)]">
                                  {p.messageCount} + {p.reactionCount}
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
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
            {/* Intro Header - Only visible at beginning of archive */}
            {!hasPrev && messages.length > 0 && (
              <div className="py-12 mb-8">
                <div className="max-w-2xl mx-auto text-center mb-12 px-4">
                  <p className="text-[10px] text-[var(--accent)] font-mono uppercase tracking-[0.3em] mb-4 opacity-60">
                    Vous entrez dans l'archive
                  </p>
                  <h2 className="text-2xl md:text-3xl font-medium text-[var(--text-bright)] mb-6 leading-relaxed">
                    {archive.title}
                  </h2>

                  <div className="space-y-4 text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
                    <p>
                      Ici reposent <span className="text-[var(--accent)] font-mono">{archive.stats.totalMessages.toLocaleString()}</span> fragments
                      d'une conversation qui s'étend sur <span className="text-[var(--accent)] font-mono">{parseInt(archive.stats.endDate?.split('-')[0] || '2024') - parseInt(archive.stats.startDate?.split('-')[0] || '2015')}</span> années.
                    </p>

                    <p className="text-[var(--text-tertiary)] italic">
                      Ne vous y trompez pas : si une seule main a tapé la plupart de ces mots,
                      <span className="text-[var(--warm)]"> {archive.participants.length} esprits</span> ont possédé
                      ce corps tour à tour, insufflant chacun leur part d'absurde,
                      de tendresse et de chaos dans ce flux textuel.
                    </p>

                    <p className="text-xs text-[var(--text-ghost)]">
                      Chaque message est un nœud dans un réseau de significations.
                      Naviguez dans le temps avec la timeline, ou laissez-vous porter par le courant.
                    </p>
                  </div>

                  {/* Stats mini */}
                  <div className="flex justify-center gap-8 mt-8 pt-6 border-t border-[var(--border-subtle)]">
                    <div className="text-center">
                      <p className="text-xl hud-value">{archive.stats.totalMessages.toLocaleString()}</p>
                      <p className="text-[10px] text-[var(--text-ghost)] uppercase tracking-wider">messages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl hud-value">{archive.stats.photos + archive.stats.videos}</p>
                      <p className="text-[10px] text-[var(--text-ghost)] uppercase tracking-wider">médias</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl hud-value">{archive.stats.startDate?.split('-')[0]}–{archive.stats.endDate?.split('-')[0]}</p>
                      <p className="text-[10px] text-[var(--text-ghost)] uppercase tracking-wider">période</p>
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="flex items-center gap-4 max-w-md mx-auto">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[var(--border-subtle)]" />
                  <p className="text-[10px] font-mono text-[var(--text-ghost)] uppercase tracking-widest">
                    {hasPrev ? 'Suite de l\'archive' : 'Début de l\'archive'}
                  </p>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[var(--border-subtle)]" />
                </div>
              </div>
            )}

            {/* Active Filter Banner */}
            {filterBySender && (
              <div className="mb-6 p-4 rounded-xl bg-[var(--accent-dim)] border border-[var(--accent)] flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-bright)]">
                    Affichage des messages de <span className="font-semibold text-[var(--accent)]">{filterBySender}</span>
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Cliquez sur un message pour voir son contexte dans l'archive
                  </p>
                </div>
                <button
                  onClick={() => setFilterBySender(null)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--card)] border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
                >
                  Voir tout
                </button>
              </div>
            )}

            <div className="space-y-1">
              {/* Auto-load trigger for PREVIOUS messages */}
              {hasPrev && messages.length > 0 && (
                <div ref={loadPrevRef} className="py-4 flex justify-center">
                  {loadingPrev && (
                    <div className="flex items-center gap-2 text-[var(--accent)]/50 font-mono text-xs">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Chargement...
                    </div>
                  )}
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
                    isFiltered={!!filterBySender}
                    onGoToContext={() => {
                      // Clear filter and navigate to message date
                      const dateOnly = message.date.split('T')[0]
                      setFilterBySender(null)
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('startDate', dateOnly)
                      router.push(`${pathname}?${params.toString()}`)
                    }}
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
        </main>
      </div>

      {/* Media Modal */}
      {selectedMedia && <MediaModal media={selectedMedia} onClose={() => setSelectedMedia(null)} />}

      {/* Grapheu Overlay - Fullscreen graph visualization */}
      {showGrapheu && (
        <div className="fixed inset-0 z-50 bg-[var(--void)]">
          {/* Graph */}
          <ArchiveGraph
            hubLabel="Grapheu"
            nodes={archive ? [
              // Thematic nodes - will be replaced by OCR notes later
              { id: 'theme:delires', label: 'Délires nocturnes', type: 'BILLET' as const, weight: 4, degree: 4 },
              { id: 'theme:philosophie', label: 'Philosophie de comptoir', type: 'BILLET' as const, weight: 5, degree: 5 },
              { id: 'theme:absurde', label: 'Théâtre de l\'absurde', type: 'BILLET' as const, weight: 3, degree: 3 },
              { id: 'theme:nostalgie', label: 'Nostalgie collective', type: 'BILLET' as const, weight: 4, degree: 4 },
              { id: 'theme:inside-jokes', label: 'Inside jokes légendaires', type: 'BILLET' as const, weight: 6, degree: 6 },
              { id: 'theme:debats', label: 'Débats enflammés', type: 'BILLET' as const, weight: 4, degree: 4 },
              { id: 'theme:confessions', label: 'Confessions 3h du mat\'', type: 'BILLET' as const, weight: 3, degree: 3 },
              { id: 'theme:projets', label: 'Projets avortés', type: 'BILLET' as const, weight: 2, degree: 2 },
            ] : []}
            edges={archive ? [
              // Connect thematic nodes to form clusters
              { source: 'theme:delires', target: 'theme:philosophie', type: 'CITATION' },
              { source: 'theme:delires', target: 'theme:absurde', type: 'CITATION' },
              { source: 'theme:philosophie', target: 'theme:debats', type: 'CITATION' },
              { source: 'theme:nostalgie', target: 'theme:inside-jokes', type: 'CITATION' },
              { source: 'theme:confessions', target: 'theme:nostalgie', type: 'CITATION' },
              { source: 'theme:inside-jokes', target: 'theme:projets', type: 'CITATION' },
            ] : []}
            onNodeClick={(node) => {
              if (node.id.startsWith('theme:')) {
                // Open a stacked note with the content
                openNote(node.id)
              } else if (node.id.startsWith('note:')) {
                // Future: Open OCR note
                openNote(node.id)
              }
            }}
            onClose={() => setShowGrapheu(false)}
          />

          {/* Stacked notes panels */}
          <StackedNotes
            notes={openNotes.map(id => {
              const content = getGrapheuNoteContent(id, openNote)
              return content ? { id, title: content.title, content: content.content } : null
            }).filter(Boolean) as { id: string; title: string; content: React.ReactNode }[]}
            focusedIndex={focusedNoteIndex}
            onCloseNote={closeNote}
            onCloseAll={() => { setOpenNotes([]); setFocusedNoteIndex(-1) }}
            onFocusPrevious={focusPreviousNote}
            onFocusNext={focusNextNote}
            onFocusAt={focusNoteAt}
          />
        </div>
      )}
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

function MessageItem({ message, showHeader, formatDate, onMediaClick, isFiltered, onGoToContext }: any) {
  const isMe = message.sender === 'Aubin Robert'

  return (
    <div
      className={`group animate-fadeIn ${showHeader ? 'mt-6' : 'mt-0.5'} ${isFiltered ? 'cursor-pointer' : ''}`}
      onClick={isFiltered ? onGoToContext : undefined}
    >
      {showHeader && (
        <div className="flex items-baseline gap-3 mb-1.5 px-4">
          <span
            className={`text-sm font-medium ${isMe ? 'text-[var(--accent)]' : 'text-[var(--warm)]'}`}
          >
            {message.sender}
          </span>
          <span className="text-xs text-[var(--text-ghost)]">{formatDate(message.date)}</span>
          {isFiltered && (
            <span className="text-[10px] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity">
              → Voir le contexte
            </span>
          )}
        </div>
      )}

      <div
        className={`message-block px-4 py-1.5 transition-colors ${showHeader ? 'border-l-2 border-[var(--border-subtle)]' : 'border-l-2 border-transparent ml-[2px]'} ${isFiltered ? 'group-hover:bg-[var(--accent-dim)] group-hover:border-[var(--accent)]' : ''}`}
      >
        {/* Text Content */}
        {message.content && (
          <div className="message-content text-[var(--text-primary)] leading-relaxed max-w-3xl">
            {message.content}
          </div>
        )}

        {/* Media Grid */}
        <MediaGrid media={message.media} onMediaClick={(m: any) => {
          // Prevent navigation when clicking media
          if (!isFiltered) onMediaClick(m)
        }} />

        {/* Reactions - show who reacted */}
        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
            {message.reactions.map((r: any, i: number) => {
              // Extract first name only
              const firstName = r.actor?.split(' ')[0] || 'Quelqu\'un'
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs bg-[var(--card)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors cursor-default"
                  title={r.actor}
                >
                  <span className="text-sm">{r.reaction}</span>
                  <span className="text-[var(--text-tertiary)] text-[10px]">{firstName}</span>
                </span>
              )
            })}
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
