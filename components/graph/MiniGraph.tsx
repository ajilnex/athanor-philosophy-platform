'use client'

import React, { useEffect, useMemo, useState } from 'react'

type GraphNode = {
  id: string
  label: string
  url: string
}

type GraphEdge = {
  source: string
  target: string
}

type GraphData = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface MiniGraphProps {
  centerNodeId?: string
  maxNeighbors?: number // number of neighbors to display around center
  className?: string
}

export function MiniGraph({ centerNodeId, maxNeighbors = 6, className = '' }: MiniGraphProps) {
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let aborted = false
    async function load() {
      try {
        const bust = Math.floor(Date.now() / 30000)
        const res = await fetch(`/graph-billets.json?_t=${bust}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load graph data')
        const json: GraphData = await res.json()
        if (!aborted) setData(json)
      } catch (e) {
        console.error('MiniGraph load error:', e)
      } finally {
        if (!aborted) setLoading(false)
      }
    }
    load()
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      aborted = true
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const view = useMemo(() => {
    if (!data || !centerNodeId) return null
    const center = data.nodes.find(n => n.id === centerNodeId)
    if (!center) return null

    // Collect neighbors at distance 1
    const neighborIds = new Set<string>()
    data.edges.forEach(e => {
      if (e.source === centerNodeId) neighborIds.add(e.target)
      else if (e.target === centerNodeId) neighborIds.add(e.source)
    })
    const neighbors = Array.from(neighborIds)
      .map(id => data.nodes.find(n => n.id === id)!)
      .filter(Boolean)
      .slice(0, Math.max(0, maxNeighbors))

    if (neighbors.length === 0) return null

    // Geometry: compact fit inside a smaller viewBox with margins
    const VB_WIDTH = 200
    const VB_HEIGHT = 140
    const MARGIN_X = 16
    const MARGIN_Y = 14
    const CX = 0
    const CY = 0
    const k = neighbors.length
    const angleStep = (2 * Math.PI) / k
    const minChord = 40 // minimum spacing between neighbors

    const requiredR = minChord / (2 * Math.sin(Math.max(0.001, angleStep / 2)))
    // compute max radius to keep labels within box
    const labelPad = 8
    const maxR = Math.min(VB_WIDTH / 2 - MARGIN_X - labelPad, VB_HEIGHT / 2 - MARGIN_Y - labelPad)
    const baseR = 40
    const R = Math.max(Math.min(requiredR, maxR), Math.min(baseR, maxR))

    const nodes = [
      { ...center, x: CX, y: CY, isCenter: true },
      ...neighbors.map((n, i) => {
        const theta = -Math.PI / 2 + i * angleStep // start at top
        return { ...n, x: CX + R * Math.cos(theta), y: CY + R * Math.sin(theta), isCenter: false }
      }),
    ] as Array<GraphNode & { x: number; y: number; isCenter: boolean }>

    const edges = neighbors.map(n => ({ source: center.id, target: n.id }))

    return { nodes, edges, viewBox: `${-VB_WIDTH / 2} ${-VB_HEIGHT / 2} ${VB_WIDTH} ${VB_HEIGHT}` }
  }, [data, centerNodeId, maxNeighbors])

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

  if (!view) {
    return (
      <div
        className={`bg-background/50 rounded-lg border border-subtle/20 p-4 text-center ${className}`}
      >
        <div className="text-subtle text-sm">Pas de graphe contextuel</div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`} style={{ overflow: 'hidden' }}>
      <svg viewBox={view.viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* edges */}
        {view.edges.map((e, idx) => {
          const a = view.nodes.find(n => n.id === e.source)!
          const b = view.nodes.find(n => n.id === e.target)!
          return (
            <line
              key={`e-${idx}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="hsl(var(--foreground) / 0.4)"
              strokeWidth={1}
              opacity={0.5}
            />
          )
        })}

        {/* nodes */}
        {view.nodes.map(n => {
          const r = n.isCenter ? 3 : 2
          const fontSize = n.isCenter ? 8 : 7
          const labelY = n.y - r - (n.isCenter ? 8 : 7)
          const short = n.label.length > 28 ? n.label.slice(0, 25) + '…' : n.label
          return (
            <g key={n.id}>
              {n.isCenter && (
                <circle cx={n.x} cy={n.y} r={r + 4} fill="hsl(var(--accent) / 0.15)" />
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={n.isCenter ? 'hsl(var(--accent))' : 'hsl(var(--foreground))'}
                stroke="hsl(var(--background))"
                strokeWidth={0.5}
              />
              <text
                x={n.x}
                y={labelY}
                fontSize={fontSize}
                textAnchor="middle"
                fontFamily="var(--font-serif)"
                fill="hsl(var(--foreground))"
                style={{
                  paintOrder: 'stroke',
                  stroke: 'hsl(var(--background))',
                  strokeWidth: '0.75px',
                }}
              >
                {short}
              </text>
              <a href={n.url}>
                <circle cx={n.x} cy={n.y} r={Math.max(r + 4, 9)} fill="transparent" />
              </a>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
