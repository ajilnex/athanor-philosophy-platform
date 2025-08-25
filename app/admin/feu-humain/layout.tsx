import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Archive FEU HUMAIN | Administration',
  description:
    "Archive complète de la conversation légendaire FEU HUMAIN - Une œuvre d'art numérique préservant les moments partagés",
  keywords: 'archive, conversation, messenger, feu humain, art numérique, mémoire collective',
  robots: 'noindex, nofollow', // Protéger la page des moteurs de recherche
  openGraph: {
    title: 'Archive FEU HUMAIN',
    description: "Conversation légendaire transformée en œuvre d'art numérique",
    type: 'website',
    images: [
      {
        url: '/images/feu-humain-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Archive FEU HUMAIN',
      },
    ],
  },
}

export { default } from './page'
