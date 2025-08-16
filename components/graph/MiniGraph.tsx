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

  // Generate linear horizontal graph layout
  const miniGraphData = React.useMemo(() => {
    if (!graphData || !centerNodeId) return null

    const centerNode = graphData.nodes.find(n => n.id === centerNodeId)
    if (!centerNode) return null

    // Find direct neighbors
    const neighbors = graphData.edges
      .filter(e => e.source === centerNodeId || e.target === centerNodeId)
      .map(e => (e.source === centerNodeId ? e.target : e.source))
      .map(neighborId => graphData.nodes.find(n => n.id === neighborId))
      .filter((node): node is GraphNode => node !== undefined)
      .slice(0, maxNodes - 1)

    if (neighbors.length === 0) return null // Don't show anything if no connections

    // Linear horizontal layout
    const nodes = [centerNode, ...neighbors]
    const spacing = 200 // Generous spacing for readability

    // Center node at origin
    centerNode.x = 0
    centerNode.y = 0

    // Place neighbors alternating left and right
    neighbors.forEach((node, i) => {
      const side = i % 2 === 0 ? 1 : -1 // Alternate right and left
      const step = Math.ceil((i + 1) / 2)
      node.x = side * step * spacing
      node.y = 0 // All on the same horizontal line
    })

    return {
      nodes,
      edges: graphData.edges.filter(
        e => nodes.some(n => n.id === e.source) && nodes.some(n => n.id === e.target)
      ),
    }
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
      <div
        className={`bg-background/50 rounded-lg border border-subtle/20 p-4 text-center ${className}`}
      >
        <div className="text-subtle text-sm">Pas de graphe contextuel</div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <svg viewBox="-500 -60 1000 120" className="w-full h-full">
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
              stroke="hsl(var(--foreground))"
              strokeWidth="2.5"
              opacity="0.5"
            />
          )
        })}

        {/* Render nodes */}
        {miniGraphData.nodes.map(node => {
          const isCenter = node.id === centerNodeId
          const nodeRadius = isCenter ? 8 : 6
          const labelText = node.label.length > 25 ? node.label.substring(0, 22) + '…' : node.label

          return (
            <g key={node.id}>
              {/* Node halo for center node */}
              {isCenter && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius + 4}
                  fill="hsl(var(--accent) / 0.15)"
                  stroke="none"
                />
              )}

              {/* Main node */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={isCenter ? 'hsl(var(--accent))' : 'hsl(var(--foreground))'}
                stroke="hsl(var(--background))"
                strokeWidth="2"
              />

              {/* Node labels with maximum visibility */}
              <text
                x={node.x}
                y={node.y - nodeRadius - 18}
                textAnchor="middle"
                fontSize="16"
                fontWeight="500"
                fontFamily="var(--font-serif)"
                fill="hsl(var(--foreground))"
                style={{
                  userSelect: 'none',
                  paintOrder: 'stroke',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: '4px',
                  strokeLinejoin: 'round',
                }}
              >
                {labelText}
              </text>

              {/* Clickable area for navigation */}
              <a href={node.url}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={Math.max(nodeRadius + 12, 25)}
                  fill="transparent"
                  className="cursor-pointer hover:fill-black/5 transition-all"
                />
              </a>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
