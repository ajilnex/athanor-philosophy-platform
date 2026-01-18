'use client'

/**
 * Graph data processing utilities
 * Shared logic for preparing graph data with clusters and hub
 */

import { GraphNode, GraphEdge, GraphData, ForceSettings } from './types'

export interface ProcessGraphDataOptions {
    nodes: GraphNode[]
    edges: GraphEdge[]
    hubId: string
    hubLabel: string
    hubPosition: { x: number; y: number }
    polygonRadius: number
    fixedHub?: boolean
}

/**
 * Process raw graph data into clustered layout with hub
 * Implements Union-Find for cluster detection and positions nodes on polygon vertices
 */
export function processGraphData(options: ProcessGraphDataOptions): GraphData {
    const {
        nodes: rawNodes,
        edges: rawEdges,
        hubId,
        hubLabel,
        hubPosition,
        polygonRadius,
        fixedHub = true,
    } = options

    // Create nodes with weight
    const nodes = rawNodes.map((n: any) => ({
        ...n,
        weight: n.degree || n.weight || 0,
        val: (n.degree || n.weight || 0) + 1,
    }))

    // Create links
    const links = rawEdges.map((e: any) => ({
        source: typeof e.source === 'string' ? e.source : e.source.id,
        target: typeof e.target === 'string' ? e.target : e.target.id,
        type: e.type || 'default',
    }))

    // --- Detect clusters using Union-Find ---
    const parent: Record<string, string> = {}

    const find = (x: string): string => {
        if (!parent[x]) parent[x] = x
        if (parent[x] !== x) parent[x] = find(parent[x])
        return parent[x]
    }

    const union = (a: string, b: string) => {
        parent[find(a)] = find(b)
    }

    // Initialize all nodes
    nodes.forEach((n: any) => {
        parent[n.id] = n.id
    })

    // Union connected nodes
    links.forEach((link: any) => {
        union(link.source, link.target)
    })

    // Group nodes by cluster
    const clusterMap: Record<string, any[]> = {}
    nodes.forEach((n: any) => {
        const root = find(n.id)
        if (!clusterMap[root]) clusterMap[root] = []
        clusterMap[root].push(n)
    })

    // Separate isolated nodes (clusters of size 1 with no links)
    const clusters = Object.values(clusterMap).filter(
        (c) =>
            c.length > 1 ||
            links.some((l: any) => l.source === c[0].id || l.target === c[0].id)
    )
    const isolatedNodes = Object.values(clusterMap)
        .filter(
            (c) =>
                c.length === 1 &&
                !links.some((l: any) => l.source === c[0].id || l.target === c[0].id)
        )
        .flat()

    // --- Position clusters on polygon vertices ---
    const RADIUS = polygonRadius
    const numClusters = clusters.length

    // Create polygon vertex nodes (invisible anchors)
    const polygonNodes: any[] = []
    const polygonLinks: any[] = []

    clusters.forEach((cluster, i) => {
        const angle = (i / numClusters) * Math.PI * 2 - Math.PI / 2
        const cx = hubPosition.x + Math.cos(angle) * RADIUS
        const cy = hubPosition.y + Math.sin(angle) * RADIUS

        // Create anchor node for this cluster vertex
        const anchorId = `__polygon_vertex_${i}__`
        polygonNodes.push({
            id: anchorId,
            label: '',
            type: 'POLYGON_VERTEX',
            isPolygonVertex: true,
            x: cx,
            y: cy,
            fx: cx,
            fy: cy,
            weight: 0,
            val: 0.1,
        })

        // Position cluster nodes around this vertex
        cluster.forEach((node: any, j: number) => {
            const clusterAngle = (j / cluster.length) * Math.PI * 2
            const clusterRadius = Math.min(30 + cluster.length * 3, 80)
            node.x = cx + Math.cos(clusterAngle) * clusterRadius
            node.y = cy + Math.sin(clusterAngle) * clusterRadius
            node.clusterId = i

            // Link node to its cluster anchor
            polygonLinks.push({
                source: anchorId,
                target: node.id,
                type: 'CLUSTER_ANCHOR',
            })
        })
    })

    // Draw polygon edges between vertices
    for (let i = 0; i < numClusters; i++) {
        const next = (i + 1) % numClusters
        polygonLinks.push({
            source: `__polygon_vertex_${i}__`,
            target: `__polygon_vertex_${next}__`,
            type: 'POLYGON_EDGE',
        })
    }

    // Create central hub
    const hubNode: any = {
        id: hubId,
        label: `✧ ${hubLabel} ✧`,
        type: 'HUB',
        weight: isolatedNodes.length,
        val: Math.max(isolatedNodes.length, 5),
        isHub: true,
        x: hubPosition.x,
        y: hubPosition.y,
    }

    if (fixedHub) {
        hubNode.fx = hubPosition.x
        hubNode.fy = hubPosition.y
    }

    // Position isolated nodes around hub
    isolatedNodes.forEach((node: any, i: number) => {
        const angle = (i / isolatedNodes.length) * Math.PI * 2
        const r = 50 + Math.random() * 30
        node.x = hubPosition.x + Math.cos(angle) * r
        node.y = hubPosition.y + Math.sin(angle) * r
        node.isIsolated = true
        node.isolatedIndex = i

        // Connect isolated node to hub
        polygonLinks.push({
            source: hubId,
            target: node.id,
            type: 'HUB_LINK',
        })
    })

    // Combine all data
    const allNodes = [...nodes, ...polygonNodes, hubNode]
    const allLinks = [...links, ...polygonLinks]

    return { nodes: allNodes, links: allLinks }
}

/**
 * Configure d3 forces for the graph simulation
 */
export function configureForces(
    fg: any,
    forces: ForceSettings,
    nodes: GraphNode[],
    hubPosition: { x: number; y: number },
    isExpanded: boolean,
    revealPhase: number
) {
    if (!fg) return

    // Configure charge force (repulsion)
    fg.d3Force('charge')?.strength(forces.chargeStrength)

    // Configure link distance
    fg.d3Force('link')?.distance(forces.linkDistance)

    // Import d3-force dynamically
    if (typeof window !== 'undefined') {
        import('d3-force').then((d3) => {
            // Find cluster anchors
            const anchors: Record<number, { x: number; y: number }> = {}
            nodes.forEach((n: any) => {
                if (n.isPolygonVertex && n.id.startsWith('__polygon_vertex_')) {
                    const idx = parseInt(n.id.replace('__polygon_vertex_', '').replace('__', ''))
                    anchors[idx] = { x: n.fx, y: n.fy }
                }
            })

            // Store original vertex positions
            const vertexOriginalPos: Record<string, { x: number; y: number }> = {}
            const RADIUS = forces.polygonRadius
            nodes.forEach((n: any) => {
                if (n.isPolygonVertex && n.id.startsWith('__polygon_vertex_')) {
                    const idx = parseInt(n.id.replace('__polygon_vertex_', '').replace('__', ''))
                    const totalClusters = Object.keys(anchors).length || 1
                    const angle = (idx / totalClusters) * Math.PI * 2 - Math.PI / 2
                    vertexOriginalPos[n.id] = {
                        x: hubPosition.x + Math.cos(angle) * RADIUS,
                        y: hubPosition.y + Math.sin(angle) * RADIUS,
                    }
                }
            })

            // Bloom animation force
            const bloomForce = (alpha: number) => {
                nodes.forEach((node: any) => {
                    // Hub always stays at position
                    if (node.isHub) {
                        const strength = 0.8
                        node.vx = (node.vx || 0) + (hubPosition.x - node.x) * strength * alpha
                        node.vy = (node.vy || 0) + (hubPosition.y - node.y) * strength * alpha
                        return
                    }

                    // COLLAPSED STATE: Everything pulls to hub
                    if (!isExpanded) {
                        const strength = 0.7
                        node.vx = (node.vx || 0) + (hubPosition.x - node.x) * strength * alpha
                        node.vy = (node.vy || 0) + (hubPosition.y - node.y) * strength * alpha
                        return
                    }

                    // EXPANDED STATE with phases
                    // Polygon vertices
                    if (node.isPolygonVertex && vertexOriginalPos[node.id]) {
                        const idx = parseInt(node.id.replace('__polygon_vertex_', '').replace('__', ''))
                        const shouldReveal = revealPhase >= 1000 + idx

                        if (shouldReveal) {
                            const orig = vertexOriginalPos[node.id]
                            const strength = 0.4
                            node.vx = (node.vx || 0) + (orig.x - node.x) * strength * alpha
                            node.vy = (node.vy || 0) + (orig.y - node.y) * strength * alpha
                        } else {
                            const strength = 0.5
                            node.vx = (node.vx || 0) + (hubPosition.x - node.x) * strength * alpha
                            node.vy = (node.vy || 0) + (hubPosition.y - node.y) * strength * alpha
                        }
                        return
                    }

                    // Cluster nodes
                    if (node.clusterId !== undefined && anchors[node.clusterId]) {
                        const shouldReveal = revealPhase >= 1000 + node.clusterId

                        if (shouldReveal) {
                            const anchor = anchors[node.clusterId]
                            const strength = 0.35
                            node.vx = (node.vx || 0) + (anchor.x - node.x) * strength * alpha
                            node.vy = (node.vy || 0) + (anchor.y - node.y) * strength * alpha
                        } else {
                            const strength = 0.5
                            node.vx = (node.vx || 0) + (hubPosition.x - node.x) * strength * alpha
                            node.vy = (node.vy || 0) + (hubPosition.y - node.y) * strength * alpha
                        }
                        return
                    }

                    // Isolated nodes
                    if (node.isIsolated) {
                        const idx = node.isolatedIndex ?? 0
                        const shouldReveal = revealPhase >= 1 + idx
                        const total = nodes.filter((n: any) => n.isIsolated).length

                        if (shouldReveal) {
                            const angle = (idx / total) * Math.PI * 2
                            const targetR = 100 + (idx % 3) * 30
                            const targetX = hubPosition.x + Math.cos(angle) * targetR
                            const targetY = hubPosition.y + Math.sin(angle) * targetR

                            const strength = 0.5
                            node.vx = (node.vx || 0) + (targetX - node.x) * strength * alpha
                            node.vy = (node.vy || 0) + (targetY - node.y) * strength * alpha
                        } else {
                            const strength = 0.5
                            node.vx = (node.vx || 0) + (hubPosition.x - node.x) * strength * alpha
                            node.vy = (node.vy || 0) + (hubPosition.y - node.y) * strength * alpha
                        }
                    }
                })
            }

            fg.d3Force('cluster', bloomForce)
            fg.d3Force('collide', d3.forceCollide(forces.collisionRadius))
            fg.d3ReheatSimulation()
        })
    }
}
