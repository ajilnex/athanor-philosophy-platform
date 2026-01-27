import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

interface RouteParams {
    params: Promise<{ gameId: string }>
}

// Ship configurations: type -> size
const SHIP_SIZES: Record<string, number> = {
    tetra: 2,
    hexa: 3,
    octa: 3,
    dodeca: 4,
    icosa: 5,
}

interface Position {
    x: number
    y: number
}

// POST /api/games/battle/[gameId]/setup - Submit ship placement
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { gameId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
        }

        const { ships } = await request.json()

        if (!ships || !Array.isArray(ships) || ships.length !== 5) {
            return NextResponse.json({ error: 'Placement invalide' }, { status: 400 })
        }

        const game = await prisma.battleGame.findUnique({
            where: { id: gameId },
            include: { ships: true },
        })

        if (!game) {
            return NextResponse.json({ error: 'Partie non trouvée' }, { status: 404 })
        }

        if (game.status !== 'setup') {
            return NextResponse.json({ error: 'Phase de placement terminée' }, { status: 400 })
        }

        const isPlayer = game.player1Id === session.user.id || game.player2Id === session.user.id
        if (!isPlayer) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
        }

        // Check if player already placed ships
        const existingShips = game.ships.filter(s => s.playerId === session.user.id)
        if (existingShips.length > 0) {
            return NextResponse.json({ error: 'Bateaux déjà placés' }, { status: 400 })
        }

        // Validate ships
        const usedPositions = new Set<string>()
        const shipTypes = new Set<string>()

        for (const ship of ships) {
            const { type, positions } = ship

            // Validate type
            if (!SHIP_SIZES[type]) {
                return NextResponse.json({ error: `Type de bateau invalide: ${type}` }, { status: 400 })
            }

            // Check for duplicate types
            if (shipTypes.has(type)) {
                return NextResponse.json({ error: `Bateau en double: ${type}` }, { status: 400 })
            }
            shipTypes.add(type)

            // Validate size
            if (!positions || positions.length !== SHIP_SIZES[type]) {
                return NextResponse.json({ error: `Taille invalide pour ${type}` }, { status: 400 })
            }

            // Validate positions are in grid and not overlapping
            for (const pos of positions as Position[]) {
                if (pos.x < 0 || pos.x >= 10 || pos.y < 0 || pos.y >= 10) {
                    return NextResponse.json({ error: 'Position hors grille' }, { status: 400 })
                }
                const key = `${pos.x},${pos.y}`
                if (usedPositions.has(key)) {
                    return NextResponse.json({ error: 'Bateaux superposés' }, { status: 400 })
                }
                usedPositions.add(key)
            }

            // Validate positions are contiguous and aligned
            const xs = (positions as Position[]).map(p => p.x)
            const ys = (positions as Position[]).map(p => p.y)
            const isHorizontal = new Set(ys).size === 1
            const isVertical = new Set(xs).size === 1

            if (!isHorizontal && !isVertical) {
                return NextResponse.json({ error: `${type} n'est pas aligné` }, { status: 400 })
            }
        }

        // All validations passed, create ships
        await prisma.battleShip.createMany({
            data: ships.map((ship: { type: string; positions: Position[] }) => ({
                gameId,
                playerId: session.user.id,
                shipType: ship.type,
                positions: JSON.stringify(ship.positions),
            })),
        })

        // Check if both players have placed their ships
        const allShips = await prisma.battleShip.findMany({ where: { gameId } })
        const player1Ships = allShips.filter(s => s.playerId === game.player1Id)
        const player2Ships = allShips.filter(s => s.playerId === game.player2Id)

        if (player1Ships.length === 5 && player2Ships.length === 5) {
            // Both players ready, start the game
            await prisma.battleGame.update({
                where: { id: gameId },
                data: {
                    status: 'playing',
                    currentTurn: game.player1Id, // Player 1 starts
                },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in setup:', error)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
