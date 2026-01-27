import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/games/battle - List all games
export async function GET() {
    try {
        const games = await prisma.battleGame.findMany({
            where: {
                status: { in: ['waiting', 'setup', 'playing'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })

        // Get player names
        const playerIds = [...new Set(games.flatMap(g => [g.player1Id, g.player2Id].filter(Boolean)))]
        const users = await prisma.user.findMany({
            where: { id: { in: playerIds as string[] } },
            select: { id: true, name: true },
        })
        const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))

        const gamesWithNames = games.map(g => ({
            ...g,
            player1Name: userMap[g.player1Id] || null,
            player2Name: g.player2Id ? userMap[g.player2Id] || null : null,
        }))

        return NextResponse.json({ games: gamesWithNames })
    } catch (error) {
        console.error('Error fetching games:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}

// POST /api/games/battle - Create a new game
export async function POST() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        const game = await prisma.battleGame.create({
            data: {
                player1Id: session.user.id,
                status: 'waiting',
            },
        })

        return NextResponse.json(game)
    } catch (error) {
        console.error('Error creating game:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
