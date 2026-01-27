import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ gameId: string }>
}

// GET /api/games/battle/[gameId] - Get game state
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { gameId } = await params
        const session = await getServerSession(authOptions)
        const userId = session?.user?.id

        const game = await prisma.battleGame.findUnique({
            where: { id: gameId },
            include: {
                ships: true,
                moves: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
        })

        if (!game) {
            return NextResponse.json({ error: 'Partie non trouvée' }, { status: 404 })
        }

        // Get player names
        const playerIds = [game.player1Id, game.player2Id].filter(Boolean) as string[]
        const users = await prisma.user.findMany({
            where: { id: { in: playerIds } },
            select: { id: true, name: true },
        })
        const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))

        // Filter ships based on who's viewing (can't see opponent's ships unless sunk)
        const isPlayer = userId === game.player1Id || userId === game.player2Id
        const myShips = game.ships.filter(s => s.playerId === userId)
        const opponentShips = game.ships
            .filter(s => s.playerId !== userId && s.sunk)
            .map(s => ({
                ...s,
                positions: s.positions, // Show positions only for sunk ships
            }))

        // Filter moves to show hits/misses appropriately
        const myMoves = game.moves.filter(m => m.playerId === userId)
        const opponentMoves = game.moves.filter(m => m.playerId !== userId)

        return NextResponse.json({
            id: game.id,
            status: game.status,
            currentTurn: game.currentTurn,
            winner: game.winner,
            player1Id: game.player1Id,
            player1Name: userMap[game.player1Id] || 'Joueur 1',
            player2Id: game.player2Id,
            player2Name: game.player2Id ? userMap[game.player2Id] || 'Joueur 2' : null,
            isPlayer,
            isMyTurn: game.currentTurn === userId,
            myShips: isPlayer ? myShips : [],
            opponentSunkShips: isPlayer ? opponentShips : [],
            myMoves: isPlayer ? myMoves : [],
            opponentMoves: isPlayer ? opponentMoves : [],
            createdAt: game.createdAt,
            updatedAt: game.updatedAt,
        })
    } catch (error) {
        console.error('Error fetching game:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

// POST /api/games/battle/[gameId] - Join a game
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { gameId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        const game = await prisma.battleGame.findUnique({
            where: { id: gameId },
        })

        if (!game) {
            return NextResponse.json({ error: 'Partie non trouvée' }, { status: 404 })
        }

        if (game.status !== 'waiting') {
            return NextResponse.json({ error: 'Partie déjà commencée' }, { status: 400 })
        }

        if (game.player1Id === session.user.id) {
            return NextResponse.json({ error: 'Vous êtes déjà dans cette partie' }, { status: 400 })
        }

        // Join the game and move to setup phase
        const updatedGame = await prisma.battleGame.update({
            where: { id: gameId },
            data: {
                player2Id: session.user.id,
                status: 'setup',
            },
        })

        return NextResponse.json(updatedGame)
    } catch (error) {
        console.error('Error joining game:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

// DELETE /api/games/battle/[gameId] - Abandon/delete game
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { gameId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        const game = await prisma.battleGame.findUnique({
            where: { id: gameId },
        })

        if (!game) {
            return NextResponse.json({ error: 'Partie non trouvée' }, { status: 404 })
        }

        const isPlayer = game.player1Id === session.user.id || game.player2Id === session.user.id
        if (!isPlayer) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
        }

        // If game is waiting and user is player1, delete it
        if (game.status === 'waiting' && game.player1Id === session.user.id) {
            await prisma.battleGame.delete({ where: { id: gameId } })
            return NextResponse.json({ success: true })
        }

        // Otherwise, mark as finished with opponent as winner
        const winner = game.player1Id === session.user.id ? game.player2Id : game.player1Id
        await prisma.battleGame.update({
            where: { id: gameId },
            data: { status: 'finished', winner },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting game:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
