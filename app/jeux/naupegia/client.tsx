'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Loader2, Plus, Users, Swords } from 'lucide-react'
import { Icosahedron } from '@/components/ui/PlatonicIcons'

interface BattleGame {
    id: string
    player1Id: string
    player1Name: string | null
    player2Id: string | null
    player2Name: string | null
    status: string
    createdAt: string
}

export default function NaupegiaClient() {
    const { data: session, status: sessionStatus } = useSession()
    const [games, setGames] = useState<BattleGame[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    const fetchGames = useCallback(async () => {
        try {
            const res = await fetch('/api/games/battle')
            if (res.ok) {
                const data = await res.json()
                setGames(data.games)
            }
        } catch (error) {
            console.error('Error fetching games:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchGames()
        const interval = setInterval(fetchGames, 5000)
        return () => clearInterval(interval)
    }, [fetchGames])

    const createGame = async () => {
        if (creating) return
        setCreating(true)
        try {
            const res = await fetch('/api/games/battle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            if (res.ok) {
                const newGame = await res.json()
                // Redirect to game
                window.location.href = `/jeux/naupegia/${newGame.id}`
            }
        } catch (error) {
            console.error('Error creating game:', error)
        } finally {
            setCreating(false)
        }
    }

    const userId = (session?.user as any)?.id

    // Separate games into categories
    const waitingGames = games.filter(g => g.status === 'waiting' && g.player1Id !== userId)
    const myGames = games.filter(g => g.player1Id === userId || g.player2Id === userId)

    if (sessionStatus === 'loading') {
        return (
            <div className="min-h-screen bg-[var(--sol-base3)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--sol-base01)]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--sol-base3)]">
            {/* Header */}
            <header className="border-b-2 border-[var(--sol-base02)] bg-[var(--sol-base3)]">
                <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/jeux"
                            className="text-[var(--sol-base01)] hover:text-[var(--sol-base02)] transition"
                        >
                            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <Icosahedron className="w-8 h-8 text-[var(--sol-cyan)]" />
                            <div>
                                <h1 className="text-2xl font-serif font-semibold text-[var(--sol-base02)] tracking-tight">
                                    Naupēgia
                                </h1>
                                <p className="text-xs font-mono text-[var(--sol-base01)] uppercase tracking-widest mt-0.5">
                                    Bataille navale
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8">
                {/* Not logged in */}
                {!session ? (
                    <div className="text-center py-20 border-2 border-dashed border-[var(--sol-base1)]">
                        <Swords className="w-12 h-12 mx-auto text-[var(--sol-base1)] mb-4" />
                        <p className="text-lg font-serif text-[var(--sol-base01)]">
                            Connexion requise
                        </p>
                        <p className="text-sm font-mono text-[var(--sol-base1)] mt-2">
                            Connectez-vous pour jouer
                        </p>
                        <Link
                            href="/api/auth/signin"
                            className="inline-block mt-6 px-6 py-3 bg-[var(--sol-base02)] text-[var(--sol-base3)] font-mono text-sm uppercase tracking-wider hover:bg-[var(--sol-base03)] transition"
                        >
                            Se connecter
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Create Game Button */}
                        <button
                            onClick={createGame}
                            disabled={creating}
                            className="w-full mb-8 py-4 border-2 border-[var(--sol-cyan)] text-[var(--sol-cyan)] font-mono uppercase tracking-wider hover:bg-[var(--sol-cyan)] hover:text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-3"
                        >
                            {creating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Plus className="w-5 h-5" />
                            )}
                            Créer une partie
                        </button>

                        {/* My Games */}
                        {myGames.length > 0 && (
                            <section className="mb-10">
                                <h2 className="text-sm font-mono text-[var(--sol-base01)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Swords className="w-4 h-4" />
                                    Mes parties
                                </h2>
                                <div className="space-y-3">
                                    {myGames.map(game => (
                                        <GameCard key={game.id} game={game} userId={userId} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Available Games */}
                        <section>
                            <h2 className="text-sm font-mono text-[var(--sol-base01)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Parties disponibles
                            </h2>
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-6 h-6 animate-spin text-[var(--sol-base01)]" />
                                </div>
                            ) : waitingGames.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-[var(--sol-base1)]">
                                    <p className="text-[var(--sol-base1)] font-mono text-sm">
                                        Aucune partie en attente
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {waitingGames.map(game => (
                                        <GameCard key={game.id} game={game} userId={userId} />
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t-2 border-[var(--sol-base02)] mt-16 py-6">
                <p className="text-center text-xs font-mono text-[var(--sol-base1)] uppercase tracking-widest">
                    Naupēgia · Athanor
                </p>
            </footer>
        </div>
    )
}

function GameCard({ game, userId }: { game: BattleGame; userId: string }) {
    const isMyGame = game.player1Id === userId || game.player2Id === userId
    const isWaiting = game.status === 'waiting'
    const isPlaying = game.status === 'playing' || game.status === 'setup'

    const statusLabel = {
        waiting: 'En attente',
        setup: 'Placement',
        playing: 'En cours',
        finished: 'Terminée',
    }[game.status] || game.status

    const statusColor = {
        waiting: 'var(--sol-orange)',
        setup: 'var(--sol-blue)',
        playing: 'var(--sol-green)',
        finished: 'var(--sol-base1)',
    }[game.status] || 'var(--sol-base1)'

    return (
        <Link
            href={`/jeux/naupegia/${game.id}`}
            className="block border-2 border-[var(--sol-base02)] bg-[var(--sol-base3)] hover:bg-[var(--sol-base2)] transition-colors"
        >
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Icosahedron className="w-6 h-6 text-[var(--sol-cyan)]" />
                    <div>
                        <p className="font-serif text-[var(--sol-base02)]">
                            {game.player1Name || 'Joueur 1'}
                            {game.player2Name && (
                                <span className="text-[var(--sol-base01)]"> vs {game.player2Name}</span>
                            )}
                        </p>
                        <p className="text-xs font-mono text-[var(--sol-base1)]">
                            {formatDistanceToNow(new Date(game.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span
                        className="px-2 py-1 text-xs font-mono uppercase tracking-wider"
                        style={{ color: statusColor, borderColor: statusColor, border: '1px solid' }}
                    >
                        {statusLabel}
                    </span>
                    {isWaiting && !isMyGame && (
                        <span className="px-3 py-1 bg-[var(--sol-cyan)] text-white text-xs font-mono uppercase tracking-wider">
                            Rejoindre
                        </span>
                    )}
                    {isPlaying && isMyGame && (
                        <span className="px-3 py-1 bg-[var(--sol-green)] text-white text-xs font-mono uppercase tracking-wider">
                            Jouer
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}
