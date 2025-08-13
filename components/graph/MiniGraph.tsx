'use client'

import React, { useEffect, useState } from 'react'

interface GraphNode {
  id: string
  label: string
  url: string
  degree: number
  x: number
  y: number
}

interface GraphEdge {
  source: string
  target: string
  weight?: number
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface MiniGraphProps {
  centerNodeId?: string
  maxNodes?: number
  className?: string
}

export function MiniGraph({ centerNodeId, maxNodes = 5, className = '' }: MiniGraphProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGraphData() {
      try {
        const response = await fetch('/graph-billets.json')
        if (!response.ok) throw new Error('Failed to load graph data')
        const data: GraphData = await response.json()
        setGraphData(data)
      } catch (error) {
        console.error('Error loading graph data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadGraphData()
  }, [])

  // Generate mini graph focused on center node
  const miniGraphData = React.useMemo(() => {
    if (!graphData || !centerNodeId) return null

    const centerNode = graphData.nodes.find(n => n.id === centerNodeId)
    if (!centerNode) return null

    // Find connected nodes
    const connectedNodeIds = new Set<string>([centerNodeId])
    const relevantEdges: GraphEdge[] = []

    // Add direct connections
    graphData.edges.forEach(edge => {
      if (edge.source === centerNodeId) {
        connectedNodeIds.add(edge.target)
        relevantEdges.push(edge)
      } else if (edge.target === centerNodeId) {
        connectedNodeIds.add(edge.source)
        relevantEdges.push(edge)
      }
    })

    // If no connections, show just the center node
    if (connectedNodeIds.size === 1) {
      return { nodes: [centerNode], edges: [] }
    }

    // Limit to maxNodes (center + connections)
    const connectedArray = Array.from(connectedNodeIds)
    const limitedNodeIds = connectedArray.slice(0, maxNodes)
    const filteredEdges = relevantEdges.filter(
      edge => limitedNodeIds.includes(edge.source) && limitedNodeIds.includes(edge.target)
    )

    // Get corresponding nodes
    const nodes = graphData.nodes.filter(n => limitedNodeIds.includes(n.id))

    return { nodes, edges: filteredEdges }
  }, [graphData, centerNodeId, maxNodes])

  if (loading) {
    return (
      <div className={`bg-background/50 rounded-lg border border-subtle/20 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-subtle/20 rounded mb-2"></div>
          <div className="h-32 bg-subtle/20 rounded"></div>
        </div>
      </div>
    )
  }

  if (!miniGraphData || miniGraphData.nodes.length === 0) {
    return (
      <div className={`bg-background/50 rounded-lg border border-subtle/20 p-4 text-center ${className}`}>
        <div className="text-subtle text-sm">Pas de graphe contextuel</div>
      </div>
    )
  }

  // Calculate SVG viewBox based on node positions
  const padding = 20
  const xs = miniGraphData.nodes.map(n => n.x)
  const ys = miniGraphData.nodes.map(n => n.y)
  const minX = Math.min(...xs) - padding
  const maxX = Math.max(...xs) + padding
  const minY = Math.min(...ys) - padding
  const maxY = Math.max(...ys) + padding

  return (
    <div className={`bg-background/50 rounded-lg border border-subtle/20 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-foreground mb-2">Graphe contextuel</h3>
      <svg
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        className="w-full h-32 border border-subtle/10 rounded"
      >
        {/* Render edges */}
        {miniGraphData.edges.map((edge, index) => {
          const fromNode = miniGraphData.nodes.find(n => n.id === edge.source)
          const toNode = miniGraphData.nodes.find(n => n.id === edge.target)
          if (!fromNode || !toNode) return null

          return (
            <line
              key={index}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-subtle/40"
            />
          )
        })}

        {/* Render nodes */}
        {miniGraphData.nodes.map((node) => {
          const isCenter = node.id === centerNodeId
          const nodeRadius = isCenter ? 5 : 3.5
          
          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill="currentColor"
                className={isCenter ? 'text-accent' : 'text-foreground/60'}
              />
              {/* Node labels for small graphs */}
              {miniGraphData.nodes.length <= 3 && (
                <text
                  x={node.x}
                  y={node.y - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  className="text-subtle"
                >
                  {node.label.length > 15 
                    ? node.label.substring(0, 12) + '...' 
                    : node.label
                  }
                </text>
              )}
            </g>
          )
        })}
      </svg>
      
      <div className="mt-2 text-xs text-subtle">
        {miniGraphData.nodes.length} nœud{miniGraphData.nodes.length > 1 ? 's' : ''}, {miniGraphData.edges.length} lien{miniGraphData.edges.length > 1 ? 's' : ''}
      </div>
    </div>
  )
}