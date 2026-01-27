import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ gameId: string }>
}

interface Position {
    x: number
    y: number
}

// POST /api/games/battle/[gameId]/fire - Fire at a position
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { gameId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        const { x, y } = await request.json()

        if (typeof x !== 'number' || typeof y !== 'number' || x < 0 || x >= 10 || y < 0 || y >= 10) {
            return NextResponse.json({ error: 'Coordonnées invalides' }, { status: 400 })
        }

        const game = await prisma.battleGame.findUnique({
            where: { id: gameId },
            include: { ships: true, moves: true },
        })

        if (!game) {
            return NextResponse.json({ error: 'Partie non trouvée' }, { status: 404 })
        }

        if (game.status !== 'playing') {
            return NextResponse.json({ error: 'Partie non en cours' }, { status: 400 })
        }

        if (game.currentTurn !== session.user.id) {
            return NextResponse.json({ error: "Ce n'est pas votre tour" }, { status: 400 })
        }

        // Check if already fired at this position
        const alreadyFired = game.moves.some(
            m => m.playerId === session.user.id && m.x === x && m.y === y
        )
        if (alreadyFired) {
            return NextResponse.json({ error: 'Déjà tiré ici' }, { status: 400 })
        }

        // Get opponent's ships
        const opponentId = game.player1Id === session.user.id ? game.player2Id : game.player1Id
        if (!opponentId) {
            return NextResponse.json({ error: 'Adversaire manquant' }, { status: 400 })
        }
        const opponentShips = game.ships.filter(s => s.playerId === opponentId)

        // Check if hit
        let hit = false
        let sunkShip: string | null = null
        let hitShipId: string | null = null

        for (const ship of opponentShips) {
            if (ship.sunk) continue

            const positions: Position[] = JSON.parse(ship.positions)
            const isHit = positions.some(p => p.x === x && p.y === y)

            if (isHit) {
                hit = true
                hitShipId = ship.id

                // Add hit to ship
                const hits: Position[] = JSON.parse(ship.hits)
                hits.push({ x, y })

                // Check if sunk
                const isSunk = hits.length === positions.length

                await prisma.battleShip.update({
                    where: { id: ship.id },
                    data: {
                        hits: JSON.stringify(hits),
                        sunk: isSunk,
                    },
                })

                if (isSunk) {
                    sunkShip = ship.shipType
                }

                break
            }
        }

        // Create move
        await prisma.battleMove.create({
            data: {
                gameId,
                playerId: session.user.id,
                x,
                y,
                hit,
                sunkShip,
            },
        })

        // Check if game is won (all opponent ships sunk)
        const updatedShips = await prisma.battleShip.findMany({
            where: { gameId, playerId: opponentId },
        })
        const allSunk = updatedShips.every(s => s.sunk)

        if (allSunk) {
            await prisma.battleGame.update({
                where: { id: gameId },
                data: {
                    status: 'finished',
                    winner: session.user.id,
                },
            })

            return NextResponse.json({
                hit,
                sunkShip,
                gameOver: true,
                winner: session.user.id,
            })
        }

        // Switch turn
        await prisma.battleGame.update({
            where: { id: gameId },
            data: { currentTurn: opponentId },
        })

        return NextResponse.json({
            hit,
            sunkShip,
            gameOver: false,
        })
    } catch (error) {
        console.error('Error firing:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
