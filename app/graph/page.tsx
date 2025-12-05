import { GraphCanvas } from '@/components/graph/GraphCanvas.d3'

export default function GraphPage() {
  return (
    <div className="h-screen w-screen">
      <GraphCanvas className="h-full w-full" />
    </div>
  )
}
