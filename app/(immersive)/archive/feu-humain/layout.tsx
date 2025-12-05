import { Metadata } from 'next'
import './feu-humain.css'

export const metadata: Metadata = {
  title: 'Archive FEU HUMAIN',
  description:
    "Archive complète de la conversation légendaire FEU HUMAIN - Une œuvre d'art numérique préservant les moments partagés",
  keywords: 'archive, conversation, messenger, feu humain, art numérique, mémoire collective',
  robots: 'index, follow',
  openGraph: {
    title: 'Archive FEU HUMAIN',
    description: "Conversation légendaire transformée en œuvre d'art numérique",
    type: 'website',
  },
}

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="archive-root">
      {children}
    </div>
  )
}
