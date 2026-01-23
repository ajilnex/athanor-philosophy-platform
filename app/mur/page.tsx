import { Metadata } from 'next'
import WallClient from './client'

export const metadata: Metadata = {
    title: 'Le Mur | Athanor',
    description: 'Flux de pensées et réflexions philosophiques',
}

export default function WallPage() {
    return <WallClient />
}
