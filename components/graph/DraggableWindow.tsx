'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, Minus, Square } from 'lucide-react'

const SNAP_THRESHOLD = 15 // Pixels to trigger snap

interface WindowRect {
    id: string
    x: number
    y: number
    width: number
    height: number
}

interface DraggableWindowProps {
    id: string
    title: string
    content: React.ReactNode
    initialPosition?: { x: number; y: number }
    initialSize?: { width: number; height: number }
    onClose: () => void
    onFocus: () => void
    zIndex: number
    otherWindows?: WindowRect[] // Positions of other windows for snapping
    onPositionChange?: (rect: WindowRect) => void // Report position changes
}

export function DraggableWindow({
    id,
    title,
    content,
    initialPosition = { x: 100, y: 100 },
    initialSize = { width: 400, height: 300 },
    onClose,
    onFocus,
    zIndex,
    otherWindows = [],
    onPositionChange,
}: DraggableWindowProps) {
    const windowRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState(initialPosition)
    const [size, setSize] = useState(initialSize)
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState<string | null>(null)
    const [isMinimized, setIsMinimized] = useState(false)
    const [isEntering, setIsEntering] = useState(true) // For entrance animation
    const [snapIndicators, setSnapIndicators] = useState<{ left?: boolean; right?: boolean; top?: boolean; bottom?: boolean }>({})
    const dragOffset = useRef({ x: 0, y: 0 })
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 })

    // Entrance animation
    useEffect(() => {
        const timer = setTimeout(() => setIsEntering(false), 300)
        return () => clearTimeout(timer)
    }, [])

    // Report position changes
    useEffect(() => {
        if (!isMinimized && onPositionChange) {
            onPositionChange({ id, x: position.x, y: position.y, width: size.width, height: size.height })
        }
    }, [position, size, isMinimized, id, onPositionChange])

    // Snapping logic
    const applySnapping = useCallback((rawX: number, rawY: number): { x: number; y: number; indicators: typeof snapIndicators } => {
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        let x = rawX
        let y = rawY
        const indicators: typeof snapIndicators = {}

        // Viewport edge snapping
        // Left edge
        if (Math.abs(x) < SNAP_THRESHOLD) {
            x = 0
            indicators.left = true
        }
        // Right edge
        if (Math.abs(x + size.width - viewportWidth) < SNAP_THRESHOLD) {
            x = viewportWidth - size.width
            indicators.right = true
        }
        // Top edge
        if (Math.abs(y) < SNAP_THRESHOLD) {
            y = 0
            indicators.top = true
        }
        // Bottom edge
        if (Math.abs(y + size.height - viewportHeight) < SNAP_THRESHOLD) {
            y = viewportHeight - size.height
            indicators.bottom = true
        }

        // Snap to other windows
        for (const other of otherWindows) {
            if (other.id === id) continue

            // Snap our left to their right
            if (Math.abs(x - (other.x + other.width)) < SNAP_THRESHOLD) {
                x = other.x + other.width
                indicators.left = true
            }
            // Snap our right to their left
            if (Math.abs((x + size.width) - other.x) < SNAP_THRESHOLD) {
                x = other.x - size.width
                indicators.right = true
            }
            // Snap our top to their bottom
            if (Math.abs(y - (other.y + other.height)) < SNAP_THRESHOLD) {
                y = other.y + other.height
                indicators.top = true
            }
            // Snap our bottom to their top
            if (Math.abs((y + size.height) - other.y) < SNAP_THRESHOLD) {
                y = other.y - size.height
                indicators.bottom = true
            }
            // Align left edges
            if (Math.abs(x - other.x) < SNAP_THRESHOLD) {
                x = other.x
                indicators.left = true
            }
            // Align right edges
            if (Math.abs((x + size.width) - (other.x + other.width)) < SNAP_THRESHOLD) {
                x = other.x + other.width - size.width
                indicators.right = true
            }
            // Align top edges
            if (Math.abs(y - other.y) < SNAP_THRESHOLD) {
                y = other.y
                indicators.top = true
            }
            // Align bottom edges
            if (Math.abs((y + size.height) - (other.y + other.height)) < SNAP_THRESHOLD) {
                y = other.y + other.height - size.height
                indicators.bottom = true
            }
        }

        return { x, y, indicators }
    }, [size.width, size.height, otherWindows, id])

    // Handle drag start
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.window-controls')) return
        e.preventDefault()
        onFocus()
        setIsDragging(true)
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        }
    }, [position, onFocus])

    // Handle resize start
    const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
        e.preventDefault()
        e.stopPropagation()
        onFocus()
        setIsResizing(direction)
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
            posX: position.x,
            posY: position.y,
        }
    }, [size, position, onFocus])

    // Handle mouse move
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const rawX = e.clientX - dragOffset.current.x
                const rawY = e.clientY - dragOffset.current.y

                // Apply snapping
                const { x: snappedX, y: snappedY, indicators } = applySnapping(rawX, rawY)

                // Clamp to viewport
                const newX = Math.max(0, Math.min(window.innerWidth - 100, snappedX))
                const newY = Math.max(0, Math.min(window.innerHeight - 50, snappedY))

                setPosition({ x: newX, y: newY })
                setSnapIndicators(indicators)
            }

            if (isResizing) {
                const deltaX = e.clientX - resizeStart.current.x
                const deltaY = e.clientY - resizeStart.current.y
                const minWidth = 250
                const minHeight = 150

                let newWidth = resizeStart.current.width
                let newHeight = resizeStart.current.height
                let newX = resizeStart.current.posX
                let newY = resizeStart.current.posY

                if (isResizing.includes('e')) {
                    newWidth = Math.max(minWidth, resizeStart.current.width + deltaX)
                }
                if (isResizing.includes('w')) {
                    const maxDeltaX = resizeStart.current.width - minWidth
                    const actualDeltaX = Math.min(deltaX, maxDeltaX)
                    newWidth = resizeStart.current.width - actualDeltaX
                    newX = resizeStart.current.posX + actualDeltaX
                }
                if (isResizing.includes('s')) {
                    newHeight = Math.max(minHeight, resizeStart.current.height + deltaY)
                }
                if (isResizing.includes('n')) {
                    const maxDeltaY = resizeStart.current.height - minHeight
                    const actualDeltaY = Math.min(deltaY, maxDeltaY)
                    newHeight = resizeStart.current.height - actualDeltaY
                    newY = resizeStart.current.posY + actualDeltaY
                }

                setSize({ width: newWidth, height: newHeight })
                setPosition({ x: newX, y: newY })
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            setIsResizing(null)
            setSnapIndicators({})
        }

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, isResizing, applySnapping])

    if (isMinimized) {
        return (
            <div
                onClick={() => { onFocus(); setIsMinimized(false) }}
                className="fixed bottom-4 cursor-pointer px-4 py-2 rounded-lg bg-[#073642] border border-[#2aa198]/30 text-[#93a1a1] text-sm hover:border-[#2aa198] transition"
                style={{ left: position.x, zIndex }}
            >
                {title}
            </div>
        )
    }

    return (
        <div
            ref={windowRef}
            className={`fixed rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ease-out ${isEntering ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                zIndex,
                transform: isEntering ? 'translateY(-10px)' : 'translateY(0)',
            }}
            onMouseDown={onFocus}
        >
            {/* Window chrome with glassmorphism */}
            <div className={`absolute inset-0 bg-[#002b36]/95 backdrop-blur-md rounded-lg border transition-colors ${Object.values(snapIndicators).some(Boolean)
                ? 'border-[#2aa198] shadow-[0_0_10px_rgba(42,161,152,0.5)]'
                : 'border-[#586e75]/50'
                }`} />

            {/* Snap edge indicators */}
            {snapIndicators.left && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#2aa198] animate-pulse" />}
            {snapIndicators.right && <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-[#2aa198] animate-pulse" />}
            {snapIndicators.top && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#2aa198] animate-pulse" />}
            {snapIndicators.bottom && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2aa198] animate-pulse" />}

            {/* Title bar */}
            <div
                className="relative h-10 flex items-center justify-between px-3 cursor-move select-none bg-gradient-to-b from-[#073642] to-transparent border-b border-[#586e75]/30"
                onMouseDown={handleDragStart}
            >
                <span className="text-sm font-medium text-[#93a1a1] truncate pr-4">{title}</span>
                <div className="window-controls flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="w-6 h-6 rounded flex items-center justify-center text-[#586e75] hover:bg-[#586e75]/20 hover:text-[#93a1a1] transition"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded flex items-center justify-center text-[#586e75] hover:bg-[#dc322f]/20 hover:text-[#dc322f] transition"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                className="relative overflow-auto text-sm text-[#839496] leading-relaxed p-4"
                style={{ height: size.height - 40 }}
            >
                {content}
            </div>

            {/* Resize handles */}
            {/* Corners */}
            <div
                className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
                onMouseDown={(e) => handleResizeStart(e, 'nw')}
            />
            <div
                className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
                onMouseDown={(e) => handleResizeStart(e, 'ne')}
            />
            <div
                className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
                onMouseDown={(e) => handleResizeStart(e, 'sw')}
            />
            <div
                className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
                onMouseDown={(e) => handleResizeStart(e, 'se')}
            />
            {/* Edges */}
            <div
                className="absolute top-0 left-3 right-3 h-1 cursor-n-resize"
                onMouseDown={(e) => handleResizeStart(e, 'n')}
            />
            <div
                className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize"
                onMouseDown={(e) => handleResizeStart(e, 's')}
            />
            <div
                className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize"
                onMouseDown={(e) => handleResizeStart(e, 'w')}
            />
            <div
                className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize"
                onMouseDown={(e) => handleResizeStart(e, 'e')}
            />
        </div>
    )
}

// Content data for each thematic node
export const GrapheuNodeContent: Record<string, { title: string; content: React.ReactNode }> = {
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
            </div>
        ),
    },
}
