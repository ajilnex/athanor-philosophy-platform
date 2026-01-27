import type { Metadata } from 'next'
import GameClient from './client'

interface PageProps {
    params: Promise<{ gameId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { gameId } = await params
    return {
        title: `Partie ${gameId.slice(0, 6)} | Naupēgia`,
        description: 'Bataille navale en cours',
    }
}

export default async function GamePage({ params }: PageProps) {
    const { gameId } = await params
    return <GameClient gameId={gameId} />
}
