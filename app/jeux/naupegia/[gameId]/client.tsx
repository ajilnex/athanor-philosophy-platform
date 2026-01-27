'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Loader2, RotateCw, Check, X, Target, Anchor } from 'lucide-react'
import {
    Tetrahedron,
    Hexahedron,
    Octahedron,
    Dodecahedron,
    Icosahedron,
} from '@/components/ui/PlatonicIcons'

// Ship configurations
const SHIPS = [
    { type: 'icosa', size: 5, Icon: Icosahedron, color: 'var(--sol-cyan)', name: 'Icosaèdre' },
    { type: 'dodeca', size: 4, Icon: Dodecahedron, color: 'var(--sol-orange)', name: 'Dodécaèdre' },
    { type: 'hexa', size: 3, Icon: Hexahedron, color: 'var(--sol-blue)', name: 'Hexaèdre' },
    { type: 'octa', size: 3, Icon: Octahedron, color: 'var(--sol-green)', name: 'Octaèdre' },
    { type: 'tetra', size: 2, Icon: Tetrahedron, color: 'var(--sol-magenta)', name: 'Tétraèdre' },
]

interface Position {
    x: number
    y: number
}

interface Ship {
    type: string
    positions: Position[]
    hits?: Position[]
    sunk?: boolean
}

interface Move {
    x: number
    y: number
    hit: boolean
    sunkShip?: string
}

interface GameState {
    id: string
    status: string
    currentTurn: string | null
    winner: string | null
    player1Id: string
    player1Name: string
    player2Id: string | null
    player2Name: string | null
    isPlayer: boolean
    isMyTurn: boolean
    myShips: Ship[]
    opponentSunkShips: Ship[]
    myMoves: Move[]
    opponentMoves: Move[]
}

export default function GameClient({ gameId }: { gameId: string }) {
    const { data: session } = useSession()
    const [game, setGame] = useState<GameState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Setup phase state
    const [placedShips, setPlacedShips] = useState<Ship[]>([])
    const [currentShipIndex, setCurrentShipIndex] = useState(0)
    const [isHorizontal, setIsHorizontal] = useState(true)
    const [submittingSetup, setSubmittingSetup] = useState(false)

    // Game phase state
    const [firing, setFiring] = useState(false)
    const [lastHit, setLastHit] = useState<{ x: number; y: number; hit: boolean } | null>(null)

    const userId = (session?.user as any)?.id

    const fetchGame = useCallback(async () => {
        try {
            const res = await fetch(`/api/games/battle/${gameId}`)
            if (!res.ok) {
                const data = await res.json()
                setError(data.error || 'Erreur')
                return
            }
            const data = await res.json()
            setGame(data)

            // Initialize placed ships from server if we have them
            if (data.myShips?.length > 0 && placedShips.length === 0) {
                setPlacedShips(
                    data.myShips.map((s: any) => ({
                        type: s.shipType,
                        positions: JSON.parse(s.positions),
                    }))
                )
                setCurrentShipIndex(5) // All ships placed
            }
        } catch (err) {
            console.error('Error fetching game:', err)
        } finally {
            setLoading(false)
        }
    }, [gameId, placedShips.length])

    useEffect(() => {
        fetchGame()
        const interval = setInterval(fetchGame, 2000)
        return () => clearInterval(interval)
    }, [fetchGame])

    // Join game if waiting
    const joinGame = async () => {
        try {
            const res = await fetch(`/api/games/battle/${gameId}`, { method: 'POST' })
            if (res.ok) {
                fetchGame()
            }
        } catch (err) {
            console.error('Error joining:', err)
        }
    }

    // Place ship on grid
    const placeShip = (x: number, y: number) => {
        if (currentShipIndex >= SHIPS.length) return

        const ship = SHIPS[currentShipIndex]
        const positions: Position[] = []

        for (let i = 0; i < ship.size; i++) {
            const pos = isHorizontal ? { x: x + i, y } : { x, y: y + i }

            // Check bounds
            if (pos.x >= 10 || pos.y >= 10) return

            // Check overlap with placed ships
            const overlaps = placedShips.some(s =>
                s.positions.some(p => p.x === pos.x && p.y === pos.y)
            )
            if (overlaps) return

            positions.push(pos)
        }

        setPlacedShips([...placedShips, { type: ship.type, positions }])
        setCurrentShipIndex(currentShipIndex + 1)
    }

    // Submit ship placement
    const submitSetup = async () => {
        if (placedShips.length !== 5 || submittingSetup) return
        setSubmittingSetup(true)

        try {
            const res = await fetch(`/api/games/battle/${gameId}/setup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ships: placedShips }),
            })

            if (res.ok) {
                fetchGame()
            } else {
                const data = await res.json()
                alert(data.error)
            }
        } catch (err) {
            console.error('Error submitting setup:', err)
        } finally {
            setSubmittingSetup(false)
        }
    }

    // Fire at opponent
    const fire = async (x: number, y: number) => {
        if (!game?.isMyTurn || firing) return

        // Check if already fired here
        const alreadyFired = game.myMoves.some(m => m.x === x && m.y === y)
        if (alreadyFired) return

        setFiring(true)
        try {
            const res = await fetch(`/api/games/battle/${gameId}/fire`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y }),
            })

            if (res.ok) {
                const data = await res.json()
                setLastHit({ x, y, hit: data.hit })
                setTimeout(() => setLastHit(null), 1500)
                fetchGame()
            }
        } catch (err) {
            console.error('Error firing:', err)
        } finally {
            setFiring(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--sol-base3)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--sol-base01)]" />
            </div>
        )
    }

    if (error || !game) {
        return (
            <div className="min-h-screen bg-[var(--sol-base3)] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-[var(--sol-red)] font-serif text-lg">{error || 'Partie non trouvée'}</p>
                    <Link href="/jeux/naupegia" className="mt-4 inline-block text-[var(--sol-cyan)] font-mono text-sm underline">
                        Retour au lobby
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--sol-base3)]">
            {/* Header */}
            <header className="border-b-2 border-[var(--sol-base02)] bg-[var(--sol-base3)]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/jeux/naupegia" className="text-[var(--sol-base01)] hover:text-[var(--sol-base02)] transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Icosahedron className="w-6 h-6 text-[var(--sol-cyan)]" />
                            <h1 className="font-serif font-semibold text-[var(--sol-base02)]">Naupēgia</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-mono">
                        <span className="text-[var(--sol-base02)]">{game.player1Name}</span>
                        <span className="text-[var(--sol-base1)]">vs</span>
                        <span className="text-[var(--sol-base02)]">{game.player2Name || '...'}</span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Waiting for opponent */}
                {game.status === 'waiting' && (
                    <div className="text-center py-20 border-2 border-dashed border-[var(--sol-base1)]">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--sol-cyan)] mx-auto mb-4" />
                        <p className="text-lg font-serif text-[var(--sol-base01)]">
                            En attente d&apos;un adversaire...
                        </p>
                        <p className="text-xs font-mono text-[var(--sol-base1)] mt-2">
                            Partagez ce lien pour inviter quelqu&apos;un
                        </p>
                    </div>
                )}

                {/* Join prompt for non-players */}
                {game.status === 'waiting' && !game.isPlayer && session && (
                    <div className="text-center py-8">
                        <button
                            onClick={joinGame}
                            className="px-8 py-4 bg-[var(--sol-cyan)] text-white font-mono uppercase tracking-wider hover:bg-[var(--sol-blue)] transition"
                        >
                            Rejoindre cette partie
                        </button>
                    </div>
                )}

                {/* Setup Phase */}
                {game.status === 'setup' && game.isPlayer && currentShipIndex < 5 && (
                    <SetupPhase
                        ships={SHIPS}
                        placedShips={placedShips}
                        currentShipIndex={currentShipIndex}
                        isHorizontal={isHorizontal}
                        onRotate={() => setIsHorizontal(!isHorizontal)}
                        onPlaceShip={placeShip}
                        onUndo={() => {
                            if (placedShips.length > 0) {
                                setPlacedShips(placedShips.slice(0, -1))
                                setCurrentShipIndex(currentShipIndex - 1)
                            }
                        }}
                    />
                )}

                {/* Setup Complete - Waiting */}
                {game.status === 'setup' && game.isPlayer && currentShipIndex >= 5 && placedShips.length === 5 && (
                    <div className="text-center py-12">
                        {game.myShips.length === 0 ? (
                            <button
                                onClick={submitSetup}
                                disabled={submittingSetup}
                                className="px-8 py-4 bg-[var(--sol-green)] text-white font-mono uppercase tracking-wider hover:bg-[var(--sol-cyan)] disabled:opacity-50 transition flex items-center gap-2 mx-auto"
                            >
                                {submittingSetup ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                Confirmer le placement
                            </button>
                        ) : (
                            <div className="border-2 border-dashed border-[var(--sol-base1)] py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-[var(--sol-cyan)] mx-auto mb-4" />
                                <p className="text-lg font-serif text-[var(--sol-base01)]">
                                    En attente de l&apos;adversaire...
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Playing Phase */}
                {game.status === 'playing' && game.isPlayer && (
                    <PlayingPhase
                        game={game}
                        onFire={fire}
                        firing={firing}
                        lastHit={lastHit}
                        userId={userId}
                    />
                )}

                {/* Game Finished */}
                {game.status === 'finished' && (
                    <div className="text-center py-20">
                        <div className={`text-6xl mb-6 ${game.winner === userId ? 'text-[var(--sol-green)]' : 'text-[var(--sol-red)]'}`}>
                            {game.winner === userId ? <Anchor className="w-20 h-20 mx-auto" /> : <X className="w-20 h-20 mx-auto" />}
                        </div>
                        <h2 className="text-3xl font-serif font-semibold text-[var(--sol-base02)] mb-4">
                            {game.winner === userId ? 'Victoire !' : 'Défaite'}
                        </h2>
                        <p className="text-[var(--sol-base01)] font-mono">
                            {game.winner === game.player1Id ? game.player1Name : game.player2Name} remporte la bataille
                        </p>
                        <Link
                            href="/jeux/naupegia"
                            className="inline-block mt-8 px-8 py-4 border-2 border-[var(--sol-cyan)] text-[var(--sol-cyan)] font-mono uppercase tracking-wider hover:bg-[var(--sol-cyan)] hover:text-white transition"
                        >
                            Nouvelle partie
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}

// Setup Phase Component
function SetupPhase({
    ships,
    placedShips,
    currentShipIndex,
    isHorizontal,
    onRotate,
    onPlaceShip,
    onUndo,
}: {
    ships: typeof SHIPS
    placedShips: Ship[]
    currentShipIndex: number
    isHorizontal: boolean
    onRotate: () => void
    onPlaceShip: (x: number, y: number) => void
    onUndo: () => void
}) {
    const currentShip = ships[currentShipIndex]

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {/* Grid */}
            <div>
                <h3 className="text-sm font-mono text-[var(--sol-base01)] uppercase tracking-widest mb-4">
                    Votre flotte
                </h3>
                <BattleGrid
                    ships={placedShips}
                    moves={[]}
                    opponentMoves={[]}
                    interactive
                    onCellClick={onPlaceShip}
                    previewShip={currentShip ? { size: currentShip.size, isHorizontal } : undefined}
                />
            </div>

            {/* Ship selector */}
            <div>
                <h3 className="text-sm font-mono text-[var(--sol-base01)] uppercase tracking-widest mb-4">
                    Bateaux à placer
                </h3>
                <div className="space-y-3 mb-6">
                    {ships.map((ship, i) => {
                        const isPlaced = i < currentShipIndex
                        const isCurrent = i === currentShipIndex
                        return (
                            <div
                                key={ship.type}
                                className={`flex items-center gap-3 px-4 py-3 border-2 transition ${isPlaced
                                    ? 'border-[var(--sol-green)] bg-[var(--sol-green)]/10'
                                    : isCurrent
                                        ? 'border-[var(--sol-cyan)] bg-[var(--sol-cyan)]/10'
                                        : 'border-[var(--sol-base1)] opacity-50'
                                    }`}
                            >
                                <div style={{ color: ship.color }}>
                                    <ship.Icon className="w-6 h-6" />
                                </div>
                                <span className="font-serif text-[var(--sol-base02)]">{ship.name}</span>
                                <span className="ml-auto font-mono text-xs text-[var(--sol-base1)]">
                                    {ship.size} cases
                                </span>
                                {isPlaced && <Check className="w-4 h-4 text-[var(--sol-green)]" />}
                            </div>
                        )
                    })}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onRotate}
                        className="flex-1 px-4 py-3 border-2 border-[var(--sol-base02)] text-[var(--sol-base02)] font-mono text-sm uppercase tracking-wider hover:bg-[var(--sol-base2)] transition flex items-center justify-center gap-2"
                    >
                        <RotateCw className="w-4 h-4" />
                        {isHorizontal ? 'Horizontal' : 'Vertical'}
                    </button>
                    <button
                        onClick={onUndo}
                        disabled={placedShips.length === 0}
                        className="px-4 py-3 border-2 border-[var(--sol-base1)] text-[var(--sol-base1)] font-mono text-sm uppercase tracking-wider hover:border-[var(--sol-red)] hover:text-[var(--sol-red)] disabled:opacity-30 transition"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    )
}

// Playing Phase Component
function PlayingPhase({
    game,
    onFire,
    firing,
    lastHit,
    userId,
}: {
    game: GameState
    onFire: (x: number, y: number) => void
    firing: boolean
    lastHit: { x: number; y: number; hit: boolean } | null
    userId: string
}) {
    const myShips = game.myShips.map(s => ({
        type: (s as any).shipType || s.type,
        positions: typeof (s as any).positions === 'string' ? JSON.parse((s as any).positions) : s.positions,
        hits: typeof (s as any).hits === 'string' ? JSON.parse((s as any).hits) : s.hits || [],
        sunk: (s as any).sunk || false,
    }))

    return (
        <div>
            {/* Turn indicator */}
            <div className={`text-center py-4 mb-6 border-2 ${game.isMyTurn ? 'border-[var(--sol-green)] bg-[var(--sol-green)]/10' : 'border-[var(--sol-base1)]'}`}>
                <p className="font-mono text-sm uppercase tracking-wider" style={{ color: game.isMyTurn ? 'var(--sol-green)' : 'var(--sol-base1)' }}>
                    {game.isMyTurn ? '→ Votre tour — Tirez !' : "Tour de l'adversaire..."}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Opponent's grid - where we fire */}
                <div>
                    <h3 className="text-sm font-mono text-[var(--sol-base01)] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Zone ennemie
                    </h3>
                    <BattleGrid
                        ships={game.opponentSunkShips}
                        moves={game.myMoves}
                        opponentMoves={[]}
                        interactive={game.isMyTurn && !firing}
                        onCellClick={onFire}
                        lastHit={lastHit}
                    />
                </div>

                {/* Our grid - shows our ships and opponent hits */}
                <div>
                    <h3 className="text-sm font-mono text-[var(--sol-base01)] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Anchor className="w-4 h-4" />
                        Votre flotte
                    </h3>
                    <BattleGrid
                        ships={myShips}
                        moves={[]}
                        opponentMoves={game.opponentMoves}
                        interactive={false}
                        onCellClick={() => { }}
                        showShips
                    />
                </div>
            </div>
        </div>
    )
}

// Battle Grid Component
function BattleGrid({
    ships,
    moves,
    opponentMoves,
    interactive,
    onCellClick,
    previewShip,
    showShips,
    lastHit,
}: {
    ships: Ship[]
    moves: Move[]
    opponentMoves: Move[]
    interactive: boolean
    onCellClick: (x: number, y: number) => void
    previewShip?: { size: number; isHorizontal: boolean }
    showShips?: boolean
    lastHit?: { x: number; y: number; hit: boolean } | null
}) {
    const [hoverPos, setHoverPos] = useState<Position | null>(null)

    // Create grid state
    const gridState: string[][] = Array.from({ length: 10 }, () => Array(10).fill('empty'))

    // Helper to safely set grid state
    const safeSetGrid = (pos: Position | undefined, value: string) => {
        if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' &&
            pos.x >= 0 && pos.x < 10 && pos.y >= 0 && pos.y < 10) {
            gridState[pos.y][pos.x] = value
        }
    }

    // Mark ships
    if (showShips) {
        for (const ship of ships) {
            if (!Array.isArray(ship.positions)) continue
            for (const pos of ship.positions) {
                safeSetGrid(pos, ship.sunk ? 'sunk' : 'ship')
            }
            // Mark hits on our ships
            if (Array.isArray(ship.hits)) {
                for (const hit of ship.hits) {
                    safeSetGrid(hit, 'hit')
                }
            }
        }
    }

    // Mark sunk opponent ships
    for (const ship of ships.filter(s => s.sunk)) {
        if (!Array.isArray(ship.positions)) continue
        for (const pos of ship.positions) {
            safeSetGrid(pos, 'sunk')
        }
    }

    // Mark our moves (firing at opponent)
    for (const move of moves) {
        safeSetGrid(move, move.hit ? 'hit' : 'miss')
    }

    // Mark opponent moves (hits on our ships)
    for (const move of opponentMoves) {
        safeSetGrid(move, move.hit ? 'hit' : 'miss')
    }

    // Preview positions
    const previewPositions: Position[] = []
    if (previewShip && hoverPos) {
        for (let i = 0; i < previewShip.size; i++) {
            const pos = previewShip.isHorizontal
                ? { x: hoverPos.x + i, y: hoverPos.y }
                : { x: hoverPos.x, y: hoverPos.y + i }
            if (pos.x < 10 && pos.y < 10) {
                previewPositions.push(pos)
            }
        }
    }

    // Check if preview is valid
    const isValidPreview = previewPositions.length === previewShip?.size &&
        !previewPositions.some(p => {
            if (gridState[p.y]?.[p.x] !== 'empty') return true
            return ships.some(s => Array.isArray(s.positions) && s.positions.some(sp => sp.x === p.x && sp.y === p.y))
        })

    return (
        <div className="inline-block border-2 border-[var(--sol-base02)]">
            {/* Column headers */}
            <div className="flex">
                <div className="w-8 h-8" />
                {Array.from({ length: 10 }, (_, i) => (
                    <div
                        key={i}
                        className="w-8 h-8 flex items-center justify-center text-xs font-mono text-[var(--sol-base1)]"
                    >
                        {String.fromCharCode(65 + i)}
                    </div>
                ))}
            </div>

            {/* Grid rows */}
            {Array.from({ length: 10 }, (_, y) => (
                <div key={y} className="flex">
                    {/* Row header */}
                    <div className="w-8 h-8 flex items-center justify-center text-xs font-mono text-[var(--sol-base1)]">
                        {y + 1}
                    </div>

                    {/* Cells */}
                    {Array.from({ length: 10 }, (_, x) => {
                        const state = gridState[y]?.[x] || 'empty'
                        const isPreview = previewPositions.some(p => p.x === x && p.y === y)
                        const isLastHit = lastHit && lastHit.x === x && lastHit.y === y
                        const isShipCell = ships.some(s => Array.isArray(s.positions) && s.positions.some(p => p.x === x && p.y === y))

                        let bgColor = 'var(--sol-base2)'
                        let content = null

                        if (state === 'ship') {
                            bgColor = 'var(--sol-cyan)'
                        } else if (state === 'hit') {
                            bgColor = 'var(--sol-red)'
                            content = <X className="w-4 h-4 text-white" />
                        } else if (state === 'miss') {
                            bgColor = 'var(--sol-base1)'
                            content = <div className="w-2 h-2 rounded-full bg-white/50" />
                        } else if (state === 'sunk') {
                            bgColor = 'var(--sol-red)'
                            content = <X className="w-4 h-4 text-white" />
                        } else if (isPreview) {
                            bgColor = isValidPreview ? 'var(--sol-green)' : 'var(--sol-red)'
                        }

                        return (
                            <button
                                key={x}
                                onClick={() => interactive && state === 'empty' && onCellClick(x, y)}
                                onMouseEnter={() => previewShip && setHoverPos({ x, y })}
                                onMouseLeave={() => setHoverPos(null)}
                                disabled={!interactive || state !== 'empty'}
                                className={`
                                    w-8 h-8 border border-[var(--sol-base1)]/30 flex items-center justify-center transition-all
                                    ${interactive && state === 'empty' ? 'hover:bg-[var(--sol-cyan)]/30 cursor-crosshair' : ''}
                                    ${isLastHit ? 'animate-pulse ring-2 ring-white' : ''}
                                `}
                                style={{ backgroundColor: bgColor }}
                            >
                                {content}
                            </button>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}
