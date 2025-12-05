import { Metadata } from 'next'
import { Suspense } from 'react'
import FeuHumainClient from './client'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Archive FEU HUMAIN | Athanor',
  description:
    "Archive complète de la conversation légendaire FEU HUMAIN - Une œuvre d'art numérique préservant les moments partagés",
  keywords: 'archive, conversation, messenger, feu humain, art numérique, mémoire collective',
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#fdf6e3] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2aa198] mx-auto mb-4" />
        <p className="text-sm text-[#657b83] font-mono">Chargement de l'archive...</p>
      </div>
    </div>
  )
}

export default function FeuHumainPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FeuHumainClient archiveSlug="feu-humain" />
    </Suspense>
  )
}
