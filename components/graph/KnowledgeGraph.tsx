'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useRouter } from 'next/navigation'
import { Loader2, Search, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react'

interface GraphNode {
  id: string
  label: string
  type: 'BILLET' | 'AUTHOR' | 'TAG'
  val: number
  color?: string
  x?: number
  y?: number
}

interface GraphEdge {
  source: string | GraphNode
  target: string | GraphNode
  type: string
}

interface GraphData {
  nodes: GraphNode[]
  links: GraphEdge[]
}

export default function KnowledgeGraph() {
  const router = useRouter()
  const fgRef = useRef<any>(null)
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>())
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>())
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null)

  // Load data
  useEffect(() => {
    fetch('/api/graph')
      .then(res => res.json())
      .then(graphData => {
        setData(graphData)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load graph:', err)
        setLoading(false)
      })
  }, [])

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (!term || !data) return

    const match = data.nodes.find(n => n.label.toLowerCase().includes(term.toLowerCase()))

    if (match && fgRef.current) {
      // Fly to node
      fgRef.current.centerAt(match.x, match.y, 1000)
      fgRef.current.zoom(4, 2000)
      setHoverNode(match)
    }
  }

  // Handle node click
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (node.type === 'BILLET') {
        const slug = node.id.replace('billet:', '')
        router.push(`/billets/${slug}`)
      } else if (node.type === 'AUTHOR') {
        // Filter graph to show only this author's network?
        // For now just center and zoom
        fgRef.current?.centerAt(node.x, node.y, 1000)
        fgRef.current?.zoom(3, 1000)
      }
    },
    [router]
  )

  // Handle hover
  const handleNodeHover = (node: GraphNode | null) => {
    setHoverNode(node)

    if (node) {
      const neighbors = new Set<string>()
      const links = new Set<string>()

      // Find neighbors
      data?.links.forEach(link => {
        const sourceId =
          typeof link.source === 'object' ? (link.source as GraphNode).id : link.source
        const targetId =
          typeof link.target === 'object' ? (link.target as GraphNode).id : link.target

        if (sourceId === node.id || targetId === node.id) {
          neighbors.add(sourceId)
          neighbors.add(targetId)
          links.add(`${sourceId}-${targetId}`) // Simple key
        }
      })

      setHighlightNodes(neighbors)
      // Note: highlighting links is tricky with react-force-graph object references,
      // usually we just check if source/target are in highlightNodes
    } else {
      setHighlightNodes(new Set())
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2">Construction du savoir...</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Chercher une idée..."
            className="w-full bg-gray-900/80 backdrop-blur border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        {hoverNode && (
          <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-lg p-3 text-white">
            <div className="font-bold text-lg">{hoverNode.label}</div>
            <div className="text-xs text-gray-400 uppercase">{hoverNode.type}</div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => fgRef.current?.zoomToFit(1000)}
          className="p-2 bg-gray-900/80 border border-gray-700 rounded-lg text-white hover:bg-gray-800"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <button
          onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 500)}
          className="p-2 bg-gray-900/80 border border-gray-700 rounded-lg text-white hover:bg-gray-800"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 500)}
          className="p-2 bg-gray-900/80 border border-gray-700 rounded-lg text-white hover:bg-gray-800"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={data || { nodes: [], links: [] }}
        nodeLabel="label"
        nodeColor={node => node.color || '#fff'}
        nodeRelSize={6}
        linkColor={() => 'rgba(255,255,255,0.2)'}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        backgroundColor="#000000"
        // Custom rendering for highlighted nodes
        nodeCanvasObject={(node, ctx, globalScale) => {
          const isHovered = node === hoverNode
          const isNeighbor = highlightNodes.has(node.id)
          const label = node.label
          const fontSize = 12 / globalScale

          // Draw circle
          ctx.beginPath()
          const r = Math.sqrt(node.val) * 2 // Base radius
          ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false)
          ctx.fillStyle = node.color || '#fff'
          ctx.fill()

          // Draw highlight ring
          if (isHovered || isNeighbor) {
            ctx.beginPath()
            ctx.arc(node.x!, node.y!, r + 2, 0, 2 * Math.PI, false)
            ctx.strokeStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.5)'
            ctx.lineWidth = 1 / globalScale
            ctx.stroke()
          }

          // Draw label if hovered or high zoom or important node
          if (isHovered || globalScale > 1.5 || node.val > 8) {
            ctx.font = `${fontSize}px Sans-Serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = isHovered ? '#fff' : 'rgba(255,255,255,0.8)'
            ctx.fillText(label, node.x!, node.y! + r + fontSize)
          }
        }}
      />
    </div>
  )
}
