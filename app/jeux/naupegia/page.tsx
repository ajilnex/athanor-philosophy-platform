import type { Metadata } from 'next'
import NaupegiaClient from './client'

export const metadata: Metadata = {
    title: 'Naupēgia | Athanor',
    description: 'Bataille navale multijoueur entre membres Athanor',
}

export default function NaupegiaPage() {
    return <NaupegiaClient />
}
