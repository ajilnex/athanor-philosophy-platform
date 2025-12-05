import type { Metadata } from 'next'
import { GraphCanvas } from '@/components/graph/GraphCanvas'

export const metadata: Metadata = {
  title: 'Constellation',
  description: 'Exploration du graphe des billets — constellation interactive',
}

export default function ConstellationPage() {
  return (
    <div className="h-screen w-screen">
      <GraphCanvas className="h-full w-full" />
    </div>
  )
}
