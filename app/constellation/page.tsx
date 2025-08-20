import type { Metadata } from 'next'
import { InteractiveGraph } from '@/components/graph/InteractiveGraph'

export const metadata: Metadata = {
  title: 'Constellation',
  description: 'Exploration du graphe complet des billets — constellation interactive',
}

export default function ConstellationPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      <div className="relative h-[calc(100dvh-5rem)] max-h-[100dvh] overflow-hidden">
        <InteractiveGraph className="w-full h-full" />
      </div>
      <div className="relative z-10 pointer-events-none p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-light text-foreground">Constellation</h1>
      </div>
    </div>
  )
}
