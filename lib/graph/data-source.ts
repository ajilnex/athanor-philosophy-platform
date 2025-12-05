/**
 * Graph Data Source
 * Fetches and transforms graph data for visualization
 */

import { GraphData, GraphNode, GraphEdge } from './types'

interface RawGraphData {
    nodes: Array<{
        id: string
        label: string
        type: string
        slug?: string
        degree?: number
    }>
    links: Array<{
        source: string
        target: string
        type?: string
    }>
}

/**
 * Fetch graph data from API or static JSON
 */
export async function fetchGraphData(): Promise<GraphData> {
    // Try API first, fall back to static JSON
    try {
        const res = await fetch('/api/graph')
        if (res.ok) {
            const raw: RawGraphData = await res.json()
            return transformGraphData(raw)
        }
    } catch (e) {
        console.warn('API fetch failed, trying static JSON')
    }

    // Fallback to static file
    const res = await fetch('/graph-billets.json')
    const raw: RawGraphData = await res.json()
    return transformGraphData(raw)
}

/**
 * Transform raw API data to clean GraphData
 */
function transformGraphData(raw: RawGraphData): GraphData {
    // Calculate node weights based on connection count
    const connectionCount = new Map<string, number>()

    raw.links.forEach(link => {
        connectionCount.set(link.source, (connectionCount.get(link.source) || 0) + 1)
        connectionCount.set(link.target, (connectionCount.get(link.target) || 0) + 1)
    })

    const maxConnections = Math.max(...connectionCount.values(), 1)

    const nodes: GraphNode[] = raw.nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: (n.type as 'BILLET' | 'TAG' | 'AUTHOR') || 'BILLET',
        slug: n.slug || n.id.replace('billet:', ''),
        weight: Math.max(1, (connectionCount.get(n.id) || 1) / maxConnections * 10),
    }))

    const edges: GraphEdge[] = raw.links.map(l => ({
        source: l.source,
        target: l.target,
        type: (l.type as 'BACKLINK' | 'TAG' | 'AUTHOR') || 'BACKLINK',
    }))

    return { nodes, edges }
}

/**
 * Find neighbors of a node (for highlighting)
 */
export function getNeighborIds(nodeId: string, edges: GraphEdge[]): Set<string> {
    const neighbors = new Set<string>()
    neighbors.add(nodeId)

    edges.forEach(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id

        if (sourceId === nodeId) neighbors.add(targetId)
        if (targetId === nodeId) neighbors.add(sourceId)
    })

    return neighbors
}

/**
 * Search nodes by label
 */
export function searchNodes(query: string, nodes: GraphNode[]): GraphNode | null {
    if (!query.trim()) return null

    const lower = query.toLowerCase()
    return nodes.find(n => n.label.toLowerCase().includes(lower)) || null
}
