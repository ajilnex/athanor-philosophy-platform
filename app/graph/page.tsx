import dynamic from 'next/dynamic'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cerveau Numérique | Athanor',
  description: 'Visualisation dynamique des connaissances et des connexions entre chercheurs.',
}

const KnowledgeGraph = dynamic(() => import('@/components/graph/KnowledgeGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="animate-pulse">Chargement du moteur graphique...</div>
    </div>
  ),
})

export default function GraphPage() {
  return <KnowledgeGraph />
}
