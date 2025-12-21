'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, X, BookOpen, Loader2, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'

interface OCRNote {
    id: string
    mediaId: string
    nodeLabel: string
    extractedText: string
    confidence: number
    keywords: string[]
    imageUrl: string
}

interface FeuilleterClientProps {
    archiveSlug: string
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const showAround = 2

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - showAround && i <= page + showAround)) {
                pages.push(i)
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...')
            }
        }
        return pages
    }

    return (
        <div className="flex items-center justify-center gap-2 py-4">
            <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg bg-[var(--elevated)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers().map((p, i) => (
                p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-[var(--text-tertiary)]">...</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPageChange(p as number)}
                        className={`min-w-[40px] h-10 rounded-lg font-medium transition ${p === page
                            ? 'bg-[var(--accent)] text-black'
                            : 'bg-[var(--elevated)] text-[var(--text-primary)] hover:bg-[var(--surface)]'
                            }`}
                    >
                        {p}
                    </button>
                )
            ))}

            <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-[var(--elevated)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    )
}

export default function FeuilleterClient({ archiveSlug }: FeuilleterClientProps) {
    const [notes, setNotes] = useState<OCRNote[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedNote, setSelectedNote] = useState<OCRNote | null>(null)
    const [copied, setCopied] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 50

    const loadPage = useCallback(async (pageNum: number) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/archive/${archiveSlug}/feuilleter?page=${pageNum}&limit=${limit}`)
            const data = await res.json()
            if (data.notes) {
                setNotes(data.notes)
                setTotalPages(data.totalPages)
                setTotal(data.total)
                setPage(pageNum)
            }
        } catch (error) {
            console.error('Error loading notes:', error)
        } finally {
            setLoading(false)
        }
    }, [archiveSlug])

    useEffect(() => {
        loadPage(1)
    }, [loadPage])

    const changePage = useCallback((newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            loadPage(newPage)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }, [loadPage, totalPages])

    const openNote = useCallback((note: OCRNote) => {
        const idx = notes.findIndex(n => n.id === note.id)
        setCurrentIndex(idx)
        setSelectedNote(note)
        setCopied(false)
    }, [notes])

    const showPrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            setSelectedNote(notes[currentIndex - 1])
            setCopied(false)
        }
    }, [currentIndex, notes])

    const showNext = useCallback(() => {
        if (currentIndex < notes.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setSelectedNote(notes[currentIndex + 1])
            setCopied(false)
        }
    }, [currentIndex, notes])

    const copyText = useCallback(async () => {
        if (selectedNote?.extractedText) {
            await navigator.clipboard.writeText(selectedNote.extractedText)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }, [selectedNote])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedNote) return
            if (e.key === 'ArrowLeft') showPrevious()
            if (e.key === 'ArrowRight') showNext()
            if (e.key === 'Escape') setSelectedNote(null)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedNote, showPrevious, showNext])

    return (
        <div className="min-h-screen bg-[var(--void)]">
            <header className="bg-[var(--abyss)] border-b border-[var(--border-subtle)]">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/archive/${archiveSlug}`}
                            className="p-2 rounded-lg hover:bg-[var(--elevated)] transition text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-[var(--accent)]" />
                                FEUilleter
                            </h1>
                            <p className="text-sm text-[var(--text-tertiary)]">
                                {total} extraits de texte • Page {page}/{totalPages}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-32">
                        <BookOpen className="w-16 h-16 mx-auto text-[var(--text-tertiary)] opacity-50 mb-4" />
                        <p className="text-[var(--text-tertiary)]">Aucun extrait trouvé</p>
                    </div>
                ) : (
                    <>
                        {/* Pagination top */}
                        <Pagination page={page} totalPages={totalPages} onPageChange={changePage} />

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                            {notes.map((note) => (
                                <button
                                    key={note.id}
                                    onClick={() => openNote(note)}
                                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--abyss)] hover:border-[var(--accent)] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[var(--accent)]/20"
                                >
                                    {/* Image - fully visible */}
                                    <img
                                        src={note.imageUrl}
                                        alt={note.nodeLabel}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                    />

                                    {/* Title - centered with localized frosted glass */}
                                    <div className="absolute inset-0 flex items-center justify-center p-3">
                                        <div className="bg-white/40 backdrop-blur-xl rounded-xl px-3 py-2 max-w-[92%] shadow-lg">
                                            <p className="text-sm text-black font-semibold leading-snug text-center">
                                                {note.nodeLabel}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Accent border on hover */}
                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-[var(--accent)] rounded-2xl transition-colors pointer-events-none" />
                                </button>
                            ))}
                        </div>

                        {/* Pagination bottom */}
                        <Pagination page={page} totalPages={totalPages} onPageChange={changePage} />
                    </>
                )}
            </main>

            {/* Modal */}
            {selectedNote && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setSelectedNote(null)}>
                    <div className="bg-[var(--abyss)] rounded-2xl border border-[var(--border-subtle)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 text-xs rounded ${selectedNote.confidence > 70 ? 'bg-green-900/30 text-green-400' :
                                    selectedNote.confidence > 50 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'
                                    }`}>OCR {Math.round(selectedNote.confidence)}%</span>
                                <span className="text-sm text-[var(--text-tertiary)]">{currentIndex + 1} / {notes.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={copyText} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-dim)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition text-sm">
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copié !' : 'Copier'}
                                </button>
                                <button onClick={() => setSelectedNote(null)} className="p-2 rounded-lg hover:bg-[var(--elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="relative rounded-xl overflow-hidden bg-black/50 border border-[var(--border-subtle)]">
                                    <img src={selectedNote.imageUrl} alt={selectedNote.nodeLabel} className="w-full h-auto max-h-[60vh] object-contain" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{selectedNote.nodeLabel}</h3>
                                    {selectedNote.keywords?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedNote.keywords.slice(0, 8).map((kw, i) => (
                                                <span key={i} className="px-2 py-0.5 text-xs rounded bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]/30">{kw}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="bg-[var(--elevated)] rounded-xl p-4 border border-[var(--border-subtle)] max-h-[40vh] overflow-auto">
                                        <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-mono leading-relaxed">{selectedNote.extractedText}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border-t border-[var(--border-subtle)]">
                            <button onClick={showPrevious} disabled={currentIndex === 0} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--elevated)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" /> Précédent
                            </button>
                            <span className="text-xs text-[var(--text-tertiary)]">← → naviguer • Échap fermer</span>
                            <button onClick={showNext} disabled={currentIndex === notes.length - 1} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--elevated)] text-[var(--text-primary)] hover:bg-[var(--surface)] transition disabled:opacity-30 disabled:cursor-not-allowed">
                                Suivant <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
