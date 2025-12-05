import type { Metadata } from 'next'
import { ForceGraphCanvas } from '@/components/graph/ForceGraphCanvas'

export const metadata: Metadata = {
  title: 'Constellation',
  description: 'Exploration du graphe des billets — constellation interactive',
}

export default function ConstellationPage() {
  return (
    <div className="fixed inset-0 z-40">
      <ForceGraphCanvas className="w-full h-full" />
    </div>
  )
}
