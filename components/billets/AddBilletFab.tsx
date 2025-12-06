'use client'

import { useRouter } from 'next/navigation'
import { Hourglass } from 'lucide-react'

export function AddBilletFab() {
  const router = useRouter()

  const handleClick = () => {
    // Rediriger vers le nouvel éditeur avec le mode immersif activé
    router.push('/billets/nouveau?immersive=true')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all transform hover:scale-105 hover:opacity-90"
      style={{
        backgroundColor: 'var(--sol-base02)',
        border: '2px solid var(--sol-base01)',
        color: 'var(--sol-cyan)',
      }}
      aria-label="Salle du Temps — Nouveau billet"
      title="Salle du Temps — Nouveau billet"
    >
      <Hourglass className="w-6 h-6 mx-auto" />
    </button>
  )
}
