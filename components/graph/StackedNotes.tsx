'use client'

import React, { useRef, useEffect, useCallback } from 'react'

interface StackedNote {
    id: string
    title: string
    content: React.ReactNode
}

interface StackedNotesProps {
    notes: StackedNote[]
    focusedIndex: number // Which note is currently expanded (-1 if none)
    onCloseNote: (id: string) => void
    onCloseAll?: () => void
    onNoteClick?: (id: string) => void
    // Focus navigation callbacks
    onFocusPrevious?: () => void
    onFocusNext?: () => void
    onFocusAt?: (index: number) => void
}

const NOTE_WIDTH = 550 // Width of each expanded note panel
const COLLAPSED_WIDTH = 48 // Width of collapsed note edge

export function StackedNotes({
    notes,
    focusedIndex,
    onCloseNote,
    onCloseAll,
    onNoteClick,
    onFocusPrevious,
    onFocusNext,
    onFocusAt
}: StackedNotesProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    // Scroll to show focused note when it changes
    useEffect(() => {
        if (containerRef.current && notes.length > 0 && focusedIndex >= 0) {
            // Calculate scroll position to show the focused note
            const scrollTarget = Math.max(0, focusedIndex * COLLAPSED_WIDTH - COLLAPSED_WIDTH)
            containerRef.current.scrollTo({
                left: scrollTarget,
                behavior: 'smooth'
            })
        }
    }, [focusedIndex, notes.length])

    // Keyboard navigation (arrow keys)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (notes.length === 0) return

            if (e.key === 'ArrowLeft' && focusedIndex > 0) {
                // Navigate to previous note (just change focus, don't remove notes)
                if (onFocusPrevious) {
                    onFocusPrevious()
                }
            } else if (e.key === 'ArrowRight' && focusedIndex < notes.length - 1) {
                // Navigate to next note
                if (onFocusNext) {
                    onFocusNext()
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [notes.length, focusedIndex, onFocusPrevious, onFocusNext])

    // Handle clicking on a collapsed note edge
    const handleCollapsedNoteClick = useCallback((index: number, e: React.MouseEvent) => {
        e.stopPropagation()

        // Clicking a collapsed note focuses it (doesn't remove other notes)
        if (onFocusAt) {
            onFocusAt(index)
        }

        if (onNoteClick) {
            onNoteClick(notes[index].id)
        }
    }, [notes, onFocusAt, onNoteClick])

    if (notes.length === 0) return null

    // Calculate layout
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
    const maxNotesWidth = Math.floor(viewportWidth * 0.66) // Left 2/3 for notes
    const totalWidth = (notes.length - 1) * COLLAPSED_WIDTH + NOTE_WIDTH

    return (
        <div
            ref={containerRef}
            className="fixed top-0 left-0 bottom-0 overflow-x-auto overflow-y-hidden pointer-events-none"
            style={{
                width: maxNotesWidth,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}
        >
            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <div
                className="relative h-full flex flex-row"
                style={{
                    width: Math.max(totalWidth, maxNotesWidth),
                    alignItems: 'stretch',
                }}
            >
                {notes.map((note, index) => {
                    const isFocused = index === focusedIndex
                    const isCollapsed = !isFocused
                    const isBeforeFocus = index < focusedIndex
                    const isAfterFocus = index > focusedIndex

                    // Position: each note is at index * COLLAPSED_WIDTH
                    const leftPosition = index * COLLAPSED_WIDTH

                    // Z-index: focused note has highest, notes further from focus have lower
                    // Notes before focus stack naturally (left on top of further-left)
                    // Notes after focus stack in reverse (further right is lower)
                    let zIndex: number
                    if (isFocused) {
                        zIndex = 1000 // Focused always on top
                    } else if (isBeforeFocus) {
                        zIndex = index + 1 // Left notes: natural stacking
                    } else {
                        zIndex = 1000 - (index - focusedIndex) // Right notes: reverse stacking
                    }

                    return (
                        <article
                            key={note.id}
                            className="absolute top-0 h-full transition-all duration-300 ease-out pointer-events-auto"
                            style={{
                                left: leftPosition,
                                width: NOTE_WIDTH,
                                zIndex,
                                // Slight opacity reduction for collapsed notes (inactive state)
                                opacity: isCollapsed ? 0.95 : 1,
                            }}
                        >
                            {/* Note panel with LEFT-side shadow for stacking effect */}
                            <div
                                className="h-full flex flex-col bg-[#002b36] transition-shadow duration-300"
                                style={{
                                    // LEFT shadow to create the "stacked paper" effect
                                    boxShadow: isCollapsed
                                        ? '-8px 0 25px rgba(0,0,0,0.5), inset 2px 0 8px rgba(0,0,0,0.3)'
                                        : '-5px 0 20px rgba(0,0,0,0.4)',
                                    borderLeft: '1px solid #073642',
                                }}
                            >
                                {/* Collapsed edge - clickable area when collapsed */}
                                {isCollapsed && (
                                    <div
                                        className="absolute inset-y-0 left-0 flex items-center justify-center cursor-pointer z-10 transition-all duration-200 hover:bg-[#073642]/80"
                                        style={{
                                            width: COLLAPSED_WIDTH,
                                            background: 'linear-gradient(to right, #0a4052 0%, #073642 60%, transparent 100%)',
                                        }}
                                        onClick={(e) => handleCollapsedNoteClick(index, e)}
                                    >
                                        <div
                                            className="text-xs text-[#93a1a1] font-medium whitespace-nowrap overflow-hidden select-none"
                                            style={{
                                                writingMode: 'vertical-rl',
                                                textOrientation: 'mixed',
                                                transform: 'rotate(180deg)',
                                                maxHeight: 'calc(100% - 80px)',
                                                letterSpacing: '0.5px',
                                            }}
                                        >
                                            {note.title}
                                        </div>
                                    </div>
                                )}

                                {/* Header - visible only on expanded note, NO X BUTTON */}
                                <div
                                    className={`shrink-0 h-14 flex items-center px-6 border-b border-[#073642]/50 bg-[#073642]/30 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                                        }`}
                                >
                                    <h2 className="text-lg font-medium text-[#fdf6e3] tracking-tight">
                                        {note.title}
                                    </h2>
                                </div>

                                {/* Content - scrollable independently */}
                                <div
                                    className={`flex-1 overflow-y-auto transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
                                        }`}
                                    style={{
                                        padding: '24px 32px',
                                    }}
                                >
                                    <div className="text-sm text-[#839496] leading-relaxed">
                                        {note.content}
                                    </div>
                                </div>
                            </div>
                        </article>
                    )
                })}
            </div>
        </div>
    )
}

// Helper component for "See also" links
function SeeAlsoLink({ label, noteId, onOpen }: { label: string; noteId: string; onOpen: (id: string) => void }) {
    return (
        <span
            className="text-[#2aa198] cursor-pointer hover:underline"
            onClick={(e) => {
                e.stopPropagation()
                onOpen(noteId)
            }}
        >
            {label}
        </span>
    )
}

// Note ID mapping from display names
const noteIdMap: Record<string, string> = {
    'Philosophie de comptoir': 'theme:philosophie',
    "Théâtre de l'absurde": 'theme:absurde',
    'Délires nocturnes': 'theme:delires',
    'Nostalgie collective': 'theme:nostalgie',
    'Inside jokes légendaires': 'theme:inside-jokes',
    'Débats enflammés': 'theme:debats',
    "Confessions 3h du mat'": 'theme:confessions',
    'Projets avortés': 'theme:projets',
}

// Content generator for each thematic node - now accepts onOpenNote callback
export function getGrapheuNoteContent(noteId: string, onOpenNote: (id: string) => void): { title: string; content: React.ReactNode } | null {
    const contents: Record<string, { title: string; content: React.ReactNode }> = {
        'theme:delires': {
            title: 'Délires nocturnes',
            content: (
                <div className="space-y-4">
                    <p className="italic text-[#6c71c4]">"Il est 3h47 et on parle de l'existence des chaises."</p>
                    <p>Ces moments où la fatigue libère les pensées les plus absurdes. Où l'on refait le monde entre deux bâillements, où les théories les plus farfelues trouvent leur audience.</p>
                    <p>Archives connues :</p>
                    <ul className="list-disc list-inside space-y-1 text-[#657b83]">
                        <li>La grande théorie des chaussettes uniques</li>
                        <li>Pourquoi le temps n'existe pas le dimanche</li>
                        <li>Débat sur l'âme des micro-ondes</li>
                    </ul>
                    <div className="mt-6 pt-4 border-t border-[#073642]">
                        <p className="text-xs text-[#586e75]">
                            Voir aussi : <SeeAlsoLink label="Philosophie de comptoir" noteId="theme:philosophie" onOpen={onOpenNote} />, <SeeAlsoLink label="Théâtre de l'absurde" noteId="theme:absurde" onOpen={onOpenNote} />
                        </p>
                    </div>
                </div>
            ),
        },
        'theme:philosophie': {
            title: 'Philosophie de comptoir',
            content: (
                <div className="space-y-4">
                    <p className="italic text-[#6c71c4]">"Mais attend, réfléchis deux secondes..."</p>
                    <p>Nietzsche n'aurait pas renié ces conversations. Des réflexions profondes sur la condition humaine, servies avec une bière imaginaire et beaucoup trop de confiance.</p>
                    <p>Thèmes récurrents :</p>
                    <ul className="list-disc list-inside space-y-1 text-[#657b83]">
                        <li>Le libre arbitre (spoiler : on n'a jamais tranché)</li>
                        <li>La nature de la conscience</li>
                        <li>Est-ce qu'on vit dans une simulation ?</li>
                        <li>Le sens de la vie (réponse : 42)</li>
                    </ul>
                    <div className="mt-6 pt-4 border-t border-[#073642]">
                        <p className="text-xs text-[#586e75]">
                            Voir aussi : <SeeAlsoLink label="Débats enflammés" noteId="theme:debats" onOpen={onOpenNote} />
                        </p>
                    </div>
                </div>
            ),
        },
        'theme:absurde': {
            title: "Théâtre de l'absurde",
            content: (
                <div className="space-y-4">
                    <p className="italic text-[#6c71c4]">"Non mais c'est une métaphore hein"</p>
                    <p>Ionesco aurait adoré. Ces échanges qui ne mènent nulle part mais qui nous mènent exactement là où il fallait aller.</p>
                    <p>Conversations cultes :</p>
                    <ul className="list-disc list-inside space-y-1 text-[#657b83]">
                        <li>Le jour où on a parlé pendant 2h de fromage sans jamais dire "fromage"</li>
                        <li>La dispute épique sur rien</li>
                        <li>Quand tout le monde répond à côté pendant 47 messages</li>
                    </ul>
                    <div className="mt-6 pt-4 border-t border-[#073642]">
                        <p className="text-xs text-[#586e75]">
                            Voir aussi : <SeeAlsoLink label="Délires nocturnes" noteId="theme:delires" onOpen={onOpenNote} />
                        </p>
                    </div>
                </div>
            ),
        },
        'theme:nostalgie': {
            title: 'Nostalgie collective',
            content: (
                <div className="space-y-4">
                    <p className="italic text-[#6c71c4]">"Tu te souviens quand..."</p>
                    <p>Ces moments où l'on fouille dans les archives de nos mémoires partagées. Où un simple mot déclenche une cascade de souvenirs.</p>
                    <p>Époques évoquées :</p>
                    <ul className="list-disc list-inside space-y-1 text-[#657b83]">
                        <li>L'époque dorée de 2017</li>
                        <li>Les premiers jours du groupe</li>
                        <li>Les projets qu'on n'a jamais finis</li>
                        <li>Les membres partis mais jamais oubliés</li>
                    </ul>
                    <div className="mt-6 pt-4 border-t border-[#073642]">
                        <p className="text-xs text-[#586e75]">
                            Voir aussi : <SeeAlsoLink label="Inside jokes légendaires" noteId="theme:inside-jokes" onOpen={onOpenNote} />, <SeeAlsoLink label="Confessions 3h du mat'" noteId="theme:confessions" onOpen={onOpenNote} />
                        </p>
                    </div>
                </div>
            ),
        },
        'theme:inside-jokes': {
            title: 'Inside jokes légendaires',
            content: (
                <div className="space-y-4">
                    <p className="italic text-[#6c71c4]">"IYKYK"</p>
                    <p>Incompréhensibles pour les non-initiés, hilarantes pour nous. Ces références cryptiques qui déclenchent des fous rires instantanés.</p>
                    <p>Classiques intemporels :</p>
                    <ul className="list-disc list-inside space-y-1 text-[#657b83]">
                        <li>🦆 (si tu sais, tu sais)</li>
                        <li>"On en parle pas"</li>
                        <li>L'incident du 23 mars</li>
                        <li>Le concept de "l'autre truc"</li>
                    </ul>
                    <p className="text-xs text-[#586e75] mt-4">* Toute tentative d'explication détruirait la magie</p>
                    <div className="mt-6 pt-4 border-t border-[#073642]">
                        <p className="text-xs text-[#586e75]">
                            Voir aussi : <SeeAlsoLink label="Projets avortés" noteId="theme:projets" onOpen={onOpenNote} />
                        </p>
                    </div>
                </div>
            ),
        },
        'theme:debats': {
            title: 'Débats enflammés',
            content: (
                <div className="space-y-4">
                    <p className="italic text-[#6c71c4]">"JE SUIS PAS D'ACCORD"</p>
                    <p>Ces joutes verbales épiques où personne ne change d'avis mais tout le monde s'amuse. Passion, mauvaise foi, et arguments douteux garantis.</p>
                    <p>Batailles légendaires :</p>
                    <ul className="list-disc list-inside space-y-1 text-[#657b83]">
                        <li>Pain au chocolat vs Chocolatine (guerre totale)</li>
                        <li>Le meilleur film de tous les temps</li>
                        <li>La bonne façon de faire des pâtes</li>
                        <li>Est-ce que c'est vraiment de la triche si...</li>
                    </ul>
                    <div className="mt-6 pt-4 border-t border-[#073642]">
                        <p className="text-xs text-[#586e75]">
                            Voir aussi : <SeeAlsoLink label="Philosophie de comptoir" noteId="theme:philosophie" onOpen={onOpenNote} />
                        </p>
                    </div>
                </div>
            ),
        },
        'theme:confessions': {
            title: "Confessions 3h du mat'",
            content: (
                <div className="space-y-4">
                    <p className="italic text-[#6c71c4]">"Bon, je vais avouer un truc..."</p>
                    <p>La nuit efface les inhibitions. Ces moments de vulnérabilité partagée, de vérités murmurées dans le silence digital.</p>
                    <p>Ce qui a été dit ici reste ici.</p>
                    <p className="text-[#b58900] text-xs">🔒 Contenu scellé par le pacte nocturne</p>
                    <div className="mt-4 p-3 bg-[#073642] rounded-lg border border-[#586e75]/30">
                        <p className="text-[#657b83] text-xs">Certaines confessions sont trop précieuses pour être archivées. Elles vivent dans le souvenir de ceux qui étaient là.</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[#073642]">
                        <p className="text-xs text-[#586e75]">
                            Voir aussi : <SeeAlsoLink label="Nostalgie collective" noteId="theme:nostalgie" onOpen={onOpenNote} />
                        </p>
                    </div>
                </div>
            ),
        },
        'theme:projets': {
            title: 'Projets avortés',
            content: (
                <div className="space-y-4">
                    <p className="italic text-[#6c71c4]">"On devrait faire un truc..."</p>
                    <p>Le cimetière des bonnes idées. Ces projets ambitieux nés dans l'euphorie collective et morts dans l'oubli du lendemain.</p>
                    <p>R.I.P. :</p>
                    <ul className="list-disc list-inside space-y-1 text-[#657b83]">
                        <li>Le podcast (3 épisodes jamais enregistrés)</li>
                        <li>Le roadtrip collectif (5 ans de "cette année c'est la bonne")</li>
                        <li>L'app révolutionnaire (mort au stade de "j'ai une idée")</li>
                        <li>Le livre qu'on allait écrire ensemble</li>
                        <li>La chaîne YouTube (RIP 2019-2019)</li>
                    </ul>
                    <p className="text-xs text-[#586e75] mt-4">Mais peut-être qu'un jour...</p>
                    <div className="mt-6 pt-4 border-t border-[#073642]">
                        <p className="text-xs text-[#586e75]">
                            Voir aussi : <SeeAlsoLink label="Inside jokes légendaires" noteId="theme:inside-jokes" onOpen={onOpenNote} />
                        </p>
                    </div>
                </div>
            ),
        },
    }

    return contents[noteId] || null
}

// Legacy export for backward compatibility - uses empty callback
export const GrapheuNoteContent: Record<string, { title: string; content: React.ReactNode }> = {
    'theme:delires': { title: 'Délires nocturnes', content: null },
    'theme:philosophie': { title: 'Philosophie de comptoir', content: null },
    'theme:absurde': { title: "Théâtre de l'absurde", content: null },
    'theme:nostalgie': { title: 'Nostalgie collective', content: null },
    'theme:inside-jokes': { title: 'Inside jokes légendaires', content: null },
    'theme:debats': { title: 'Débats enflammés', content: null },
    'theme:confessions': { title: "Confessions 3h du mat'", content: null },
    'theme:projets': { title: 'Projets avortés', content: null },
}

