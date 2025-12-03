import { Metadata } from 'next'
import GraphContainer from '@/components/graph/GraphContainer'

export const metadata: Metadata = {
  title: 'Cerveau Numérique | Athanor',
  description: 'Visualisation dynamique des connaissances et des connexions entre chercheurs.',
}

export default function GraphPage() {
  return <GraphContainer />
}
