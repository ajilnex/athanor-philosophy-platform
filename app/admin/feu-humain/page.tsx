import { Metadata } from 'next'
import FeuHumainClient from './client'

export const metadata: Metadata = {
  title: 'Archive FEU HUMAIN | Administration',
  description:
    "Archive complète de la conversation légendaire FEU HUMAIN - Une œuvre d'art numérique préservant les moments partagés",
  keywords: 'archive, conversation, messenger, feu humain, art numérique, mémoire collective',
  robots: 'noindex, nofollow',
}

export default function FeuHumainPage() {
  // Le client charge tout de manière optimisée via les API
  return <FeuHumainClient archiveSlug="feu-humain" />
}
