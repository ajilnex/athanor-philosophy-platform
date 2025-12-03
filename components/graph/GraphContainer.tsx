'use client'

import dynamic from 'next/dynamic'

const KnowledgeGraph = dynamic(() => import('./KnowledgeGraph'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="animate-pulse">Chargement du moteur graphique...</div>
    </div>
  ),
})

export default function GraphContainer() {
  return <KnowledgeGraph />
}
