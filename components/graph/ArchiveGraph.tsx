'use client'

/**
 * ArchiveGraph - Knowledge graph for archive content
 * Based on ForceGraphCanvas, independent data source
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
    Loader2, Search, Moon, Sun, ZoomIn, ZoomOut, Maximize2,
    Settings2, X, RotateCcw, Sparkles
} from 'lucide-react'

// Dynamic import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

// Solarized color palette
const COLORS = {
    light: {
        bg: '#fdf6e3',
        node: '#2aa198',
        nodeHover: '#268bd2',
        link: 'rgba(147, 161, 161, 0.4)',
        linkHighlight: 'rgba(38, 139, 210, 0.8)',
        text: '#657b83',
        textHover: '#073642',
    },
    dark: {
        bg: '#002b36',
        node: '#2aa198',
        nodeHover: '#268bd2',
        link: 'rgba(88, 110, 117, 0.4)',
        linkHighlight: 'rgba(38, 139, 210, 0.8)',
        text: '#93a1a1',
        textHover: '#fdf6e3',
    },
}

// Force settings type
interface ForceSettings {
    chargeStrength: number
    linkDistance: number
    centerForce: number
    collisionRadius: number
    polygonRadius: number  // Distance from center for cluster vertices
}

const DEFAULT_FORCES: ForceSettings = {
    chargeStrength: -120,   // Stronger repulsion for better spacing
    linkDistance: 50,       // More space between linked nodes
    centerForce: 0.08,      // Weaker center pull for wider spread
    collisionRadius: 15,    // Larger collision for less overlap
    polygonRadius: 280,     // Larger polygon for cluster spacing
}

interface GraphNode {
    id: string
    label: string
    type?: 'BILLET' | 'AUTHOR' | 'TAG'
    slug?: string
    url?: string
    weight: number
    degree?: number
    x?: number
    y?: number
    fx?: number | null
    fy?: number | null
    val?: number
}

interface GraphEdge {
    source: string | GraphNode
    target: string | GraphNode
    type: string
}

interface GraphData {
    nodes: GraphNode[]
    edges: GraphEdge[]
}

interface ArchiveGraphProps {
    className?: string
    nodes?: GraphNode[]  // External nodes data
    edges?: GraphEdge[]  // External edges data
    onNodeClick?: (node: GraphNode) => void  // Custom node click handler
    hubLabel?: string  // Custom hub label (default: "Grapheu")
    onClose?: () => void  // Close handler for overlay mode
}

export function ArchiveGraph({
    className = '',
    nodes: externalNodes = [],
    edges: externalEdges = [],
    onNodeClick: customNodeClick,
    hubLabel = 'Grapheu',
    onClose,
}: ArchiveGraphProps) {
    const router = useRouter()
    const fgRef = useRef<any>(null)

    // State
    const [data, setData] = useState<GraphData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [nightMode, setNightMode] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [hoverNode, setHoverNode] = useState<GraphNode | null>(null)
    const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set())
    const [dimensions, setDimensions] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800
    })

    // Obsidian-style features
    const [showSettings, setShowSettings] = useState(false)
    const [showIsolated, setShowIsolated] = useState(false)
    const [forces, setForces] = useState<ForceSettings>(DEFAULT_FORCES)
    const [showLabels, setShowLabels] = useState(true)
    const [isSimulationRunning, setIsSimulationRunning] = useState(true)

    // Bloom animation state
    const [isExpanded, setIsExpanded] = useState(false)
    const [revealPhase, setRevealPhase] = useState(0)
    const [showHint, setShowHint] = useState(true) // Show click hint initially

    const colors = nightMode ? COLORS.dark : COLORS.light

    // Hub position: CENTER horizontally (x=0), TOP of visible area (negative y)
    // In canvas coordinates: (0,0) is center, negative Y is up
    const hubX = 0
    const hubY = -dimensions.height / 3 // Top third of the view

    // Helper to center view on hub (so hub appears at center-top)
    const centerOnHub = useCallback(() => {
        if (!fgRef.current) return
        // Center the view so hub is at center-top
        fgRef.current.centerAt(0, hubY / 2, 500)
    }, [hubY])

    // Load dimensions
    useEffect(() => {
        const updateDimensions = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        }
        updateDimensions()
        window.addEventListener('resize', updateDimensions)
        return () => window.removeEventListener('resize', updateDimensions)
    }, [])

    // Initialize graph data - either from props or create empty hub-only graph
    useEffect(() => {
        // Create hub node - fixed at top-right position
        const hubNode = {
            id: '__grapheu_hub__',
            label: `✧ ${hubLabel} ✧`,
            type: 'HUB',
            weight: externalNodes.length,
            val: Math.max(externalNodes.length, 5),
            isHub: true,
            x: hubX,
            y: hubY,
            fx: hubX, // Fixed X position
            fy: hubY, // Fixed Y position
        }

        // If no external data, just show the hub
        if (externalNodes.length === 0) {
            setData({ nodes: [hubNode], links: [] } as any)
            setLoading(false)
            setTimeout(() => {
                centerOnHub()
                fgRef.current?.zoom(1.5, 500)
            }, 500)
            return
        }

        // Process external nodes with weight
        const nodes = externalNodes.map((n: any) => ({
            ...n,
            weight: n.degree || n.weight || 0,
            val: (n.degree || n.weight || 0) + 1,
        }))

        // Process external links
        const links = externalEdges.map((e: any) => ({
            source: typeof e.source === 'string' ? e.source : e.source.id,
            target: typeof e.target === 'string' ? e.target : e.target.id,
            type: e.type,
        })) || []

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
        nodes.forEach((n: any) => { parent[n.id] = n.id })

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
        const clusters = Object.values(clusterMap).filter(c => c.length > 1 ||
            links.some((l: any) => l.source === c[0].id || l.target === c[0].id))
        const isolatedNodes = Object.values(clusterMap)
            .filter(c => c.length === 1 && !links.some((l: any) => l.source === c[0].id || l.target === c[0].id))
            .flat()

        // --- Position clusters on polygon vertices ---
        const RADIUS = forces.polygonRadius
        const numClusters = clusters.length

        // Create polygon vertex nodes (invisible anchors)
        const polygonNodes: any[] = []
        const polygonLinks: any[] = []

        clusters.forEach((cluster, i) => {
            const angle = (i / numClusters) * Math.PI * 2 - Math.PI / 2 // Start from top
            // Position polygon vertices relative to hub, not (0,0)
            const cx = hubX + Math.cos(angle) * RADIUS
            const cy = hubY + Math.sin(angle) * RADIUS

            // Create anchor node for this cluster vertex
            const anchorId = `__polygon_vertex_${i}__`
            polygonNodes.push({
                id: anchorId,
                label: '',
                type: 'POLYGON_VERTEX',
                isPolygonVertex: true,
                x: cx,
                y: cy,
                fx: cx, // Fixed position
                fy: cy,
                weight: 0,
                val: 0.1,
            })

            // Position cluster nodes around this vertex AND link them to anchor
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

        // Draw polygon edges (thin lines between vertices)
        for (let i = 0; i < numClusters; i++) {
            const next = (i + 1) % numClusters
            polygonLinks.push({
                source: `__polygon_vertex_${i}__`,
                target: `__polygon_vertex_${next}__`,
                type: 'POLYGON_EDGE',
            })
        }

        // Update hub node weight
        hubNode.weight = isolatedNodes.length
        hubNode.val = Math.max(isolatedNodes.length, 5)

        // Position isolated nodes around hub - USE HUB POSITION, NOT (0,0)
        isolatedNodes.forEach((node: any, i: number) => {
            const angle = (i / isolatedNodes.length) * Math.PI * 2
            const r = 50 + Math.random() * 30
            node.x = hubX + Math.cos(angle) * r
            node.y = hubY + Math.sin(angle) * r
            node.isIsolated = true

            // Connect isolated node to hub
            polygonLinks.push({
                source: hubNode.id,
                target: node.id,
                type: 'HUB_LINK',
            })
        })

        // Combine all data
        const allNodes = [...nodes, ...polygonNodes, hubNode]
        const allLinks = [...links, ...polygonLinks]

        setData({ nodes: allNodes, links: allLinks } as any)
        setLoading(false)

        setTimeout(() => {
            centerOnHub()
            fgRef.current?.zoom(1.2, 500)
        }, 500)
    }, [externalNodes, externalEdges, forces.polygonRadius, hubLabel, hubX, hubY, centerOnHub])

    // Update forces when settings change or data loads
    useEffect(() => {
        if (!data) return

        // Small delay to ensure graph is mounted
        const timer = setTimeout(() => {
            if (!fgRef.current) return

            const fg = fgRef.current
            const nodes = (data as any).nodes || []

            // Configure charge force (repulsion)
            fg.d3Force('charge')?.strength(forces.chargeStrength)

            // DISABLE the default center force - it pulls everything to (0,0)
            // This is essential to keep the hub fixed at its position
            fg.d3Force('center', null)

            // Configure link distance
            fg.d3Force('link')?.distance(forces.linkDistance)

            // Import d3-force functions if available
            if (typeof window !== 'undefined') {
                import('d3-force').then(d3 => {
                    // Find cluster anchors
                    const anchors: Record<number, { x: number; y: number }> = {}
                    nodes.forEach((n: any) => {
                        if (n.isPolygonVertex && n.id.startsWith('__polygon_vertex_')) {
                            const idx = parseInt(n.id.replace('__polygon_vertex_', '').replace('__', ''))
                            anchors[idx] = { x: n.fx, y: n.fy }
                        }
                    })

                    // Store original vertex positions - relative to hub position
                    const vertexOriginalPos: Record<string, { x: number; y: number }> = {}
                    const RADIUS = forces.polygonRadius
                    let numClustersCount = 0
                    nodes.forEach((n: any) => {
                        if (n.isPolygonVertex && n.id.startsWith('__polygon_vertex_')) {
                            const idx = parseInt(n.id.replace('__polygon_vertex_', '').replace('__', ''))
                            const totalClusters = Object.keys(anchors).length || 1
                            const angle = (idx / totalClusters) * Math.PI * 2 - Math.PI / 2
                            // Position relative to hub, not (0,0)
                            vertexOriginalPos[n.id] = {
                                x: hubX + Math.cos(angle) * RADIUS,
                                y: hubY + Math.sin(angle) * RADIUS
                            }
                            numClustersCount++
                        }
                    })

                    // Bloom animation force - controls reveal phases
                    // NEW: Cascade layout - nodes flow downward from hub
                    const bloomForce = (alpha: number) => {
                        // Get hub position for reference
                        const hubNode = nodes.find((n: any) => n.isHub)
                        const hubPosX = hubNode?.fx ?? hubX
                        const hubPosY = hubNode?.fy ?? hubY

                        nodes.forEach((node: any) => {
                            // Hub is fixed - don't apply forces
                            if (node.isHub) {
                                return
                            }

                            // COLLAPSED STATE: Everything pulls to hub position
                            if (!isExpanded) {
                                const strength = 0.7
                                node.vx = (node.vx || 0) + (hubPosX - node.x) * strength * alpha
                                node.vy = (node.vy || 0) + (hubPosY - node.y) * strength * alpha
                                return
                            }

                            // EXPANDED STATE - Cascade layout
                            // Calculate target position based on node type and index

                            // Isolated nodes - main cascade from hub
                            if (node.isIsolated) {
                                const idx = node.isolatedIndex ?? 0
                                const shouldReveal = revealPhase >= 1 + idx

                                if (shouldReveal) {
                                    // Cascade layout: spread nodes down and slightly left
                                    const row = Math.floor(idx / 3) // 3 nodes per row
                                    const col = idx % 3

                                    const rowSpacing = 80 // Vertical spacing between rows
                                    const colSpacing = 100 // Horizontal spacing between columns
                                    const startY = hubPosY + 120 // Start below hub
                                    const startX = hubPosX - colSpacing // Start from left of hub

                                    const targetX = startX + (col - 1) * colSpacing
                                    const targetY = startY + row * rowSpacing

                                    const strength = 0.4
                                    node.vx = (node.vx || 0) + (targetX - node.x) * strength * alpha
                                    node.vy = (node.vy || 0) + (targetY - node.y) * strength * alpha
                                } else {
                                    // Not revealed yet - stay at hub
                                    const strength = 0.5
                                    node.vx = (node.vx || 0) + (hubPosX - node.x) * strength * alpha
                                    node.vy = (node.vy || 0) + (hubPosY - node.y) * strength * alpha
                                }
                                return
                            }

                            // Polygon vertices - position in cascade below isolated nodes
                            if (node.isPolygonVertex && vertexOriginalPos[node.id]) {
                                const idx = parseInt(node.id.replace('__polygon_vertex_', '').replace('__', ''))
                                const shouldReveal = revealPhase >= 1000 + idx

                                if (shouldReveal) {
                                    // Position vertices in a vertical line on the left side
                                    const isolatedCount = nodes.filter((n: any) => n.isIsolated).length
                                    const isolatedRows = Math.ceil(isolatedCount / 3)

                                    const startY = hubPosY + 120 + isolatedRows * 80 + 60
                                    const targetX = hubPosX - 150 // Left of center
                                    const targetY = startY + idx * 70

                                    const strength = 0.4
                                    node.vx = (node.vx || 0) + (targetX - node.x) * strength * alpha
                                    node.vy = (node.vy || 0) + (targetY - node.y) * strength * alpha
                                } else {
                                    const strength = 0.5
                                    node.vx = (node.vx || 0) + (hubPosX - node.x) * strength * alpha
                                    node.vy = (node.vy || 0) + (hubPosY - node.y) * strength * alpha
                                }
                                return
                            }

                            // Cluster nodes - cluster around their vertex
                            if (node.clusterId !== undefined && anchors[node.clusterId]) {
                                const shouldReveal = revealPhase >= 1000 + node.clusterId

                                if (shouldReveal) {
                                    const anchor = anchors[node.clusterId]
                                    // Cluster nodes spread horizontally from their anchor
                                    const clusterNodes = nodes.filter((n: any) => n.clusterId === node.clusterId && !n.isPolygonVertex)
                                    const nodeIdx = clusterNodes.indexOf(node)

                                    const targetX = anchor.x + 80 + (nodeIdx % 2) * 60
                                    const targetY = anchor.y + Math.floor(nodeIdx / 2) * 50

                                    const strength = 0.35
                                    node.vx = (node.vx || 0) + (targetX - node.x) * strength * alpha
                                    node.vy = (node.vy || 0) + (targetY - node.y) * strength * alpha
                                } else {
                                    const strength = 0.5
                                    node.vx = (node.vx || 0) + (hubPosX - node.x) * strength * alpha
                                    node.vy = (node.vy || 0) + (hubPosY - node.y) * strength * alpha
                                }
                            }
                        })
                    }

                    fg.d3Force('cluster', bloomForce)
                    fg.d3Force('collide', d3.forceCollide(forces.collisionRadius))
                    fg.d3ReheatSimulation()
                })
            }
        }, 100)

        return () => clearTimeout(timer)
    }, [forces, data, isExpanded, revealPhase, hubX, hubY])

    // Handle node hover
    const handleNodeHover = useCallback((node: any) => {
        setHoverNode(node as GraphNode | null)

        if (node && data) {
            const neighbors = new Set<string>()
            neighbors.add(node.id)

                ; (data as any).links?.forEach((link: any) => {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target

                    if (sourceId === node.id) neighbors.add(targetId)
                    if (targetId === node.id) neighbors.add(sourceId)
                })

            setHighlightNodes(neighbors)
        } else {
            setHighlightNodes(new Set())
        }
    }, [data])

    // Trigger bloom animation - staggered reveal
    const triggerBloom = useCallback(() => {
        if (!data) return

        const nodes = (data as any).nodes || []
        const numClusters = nodes.filter((n: any) => n.isPolygonVertex).length
        const isolatedNodesList = nodes.filter((n: any) => n.isIsolated)
        const numIsolated = isolatedNodesList.length

        // Mark each isolated node with its index for staggered reveal
        isolatedNodesList.forEach((node: any, idx: number) => {
            node.isolatedIndex = idx
        })

        setIsExpanded(true)
        setRevealPhase(0)

        // Phase 1 to N: Reveal isolated nodes one by one (faster)
        for (let i = 0; i < numIsolated; i++) {
            setTimeout(() => {
                setRevealPhase(1 + i)
                // Only reheat at first reveal to start movement
                if (i === 0) fgRef.current?.d3ReheatSimulation()
            }, 100 + i * 80) // Faster timing
        }

        // After isolated nodes, reveal clusters one by one
        const isolatedDuration = 100 + numIsolated * 80 + 150
        for (let i = 0; i < numClusters; i++) {
            setTimeout(() => {
                setRevealPhase(1000 + i) // 1000+ = cluster phases
            }, isolatedDuration + i * 120) // Faster cluster reveal
        }
    }, [data])

    // Collapse animation - reverse bloom progressively
    const triggerCollapse = useCallback(() => {
        if (!data) return

        const numClusters = data.nodes.filter(n => n.type === 'BILLET').length > 0 ?
            Math.ceil(Math.sqrt(data.nodes.filter(n => n.type === 'BILLET').length)) : 3
        const isolatedCount = data.nodes.filter((n: any) => n.isIsolated).length

        // Single reheat at start
        fgRef.current?.d3ReheatSimulation()

        // Hide clusters one by one (reverse order)
        for (let i = numClusters - 1; i >= 0; i--) {
            setTimeout(() => {
                setRevealPhase(1000 + i)
            }, (numClusters - 1 - i) * 150)
        }

        // Then hide isolated nodes (reverse order)
        const clusterDuration = numClusters * 150
        for (let i = isolatedCount; i >= 0; i--) {
            setTimeout(() => {
                setRevealPhase(i)
            }, clusterDuration + (isolatedCount - i) * 80)
        }

        // Finally set collapsed state
        const totalDuration = clusterDuration + isolatedCount * 80 + 100
        setTimeout(() => {
            setIsExpanded(false)
            setRevealPhase(0)
        }, totalDuration)
    }, [data])

    // Handle node click - toggle bloom on hub or call custom handler
    const handleNodeClick = useCallback((node: any) => {
        // Click on hub toggles bloom
        if (node.isHub) {
            setShowHint(false)  // Hide click hint on first interaction
            if (isExpanded) {
                triggerCollapse()
            } else {
                triggerBloom()
            }
            return
        }

        // Regular node click - use custom handler if provided
        if (customNodeClick) {
            customNodeClick(node as GraphNode)
        }
    }, [isExpanded, triggerBloom, triggerCollapse, customNodeClick])

    // Handle node drag end - elastic return to anchor
    const handleNodeDragEnd = useCallback((node: any) => {
        // Unpin all nodes - let them return elastically to their anchors
        node.fx = undefined
        node.fy = undefined

        // Reheat simulation for elastic snap-back effect
        fgRef.current?.d3ReheatSimulation()
    }, [])

    // Unpin all nodes
    const unpinAllNodes = useCallback(() => {
        if (!data) return
            ; (data as any).nodes?.forEach((node: any) => {
                node.fx = null
                node.fy = null
            })
        fgRef.current?.d3ReheatSimulation()
    }, [data])

    // Handle search
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query)
        if (!query || !data) return

        const match = data.nodes.find(n =>
            n.label.toLowerCase().includes(query.toLowerCase())
        )

        if (match && fgRef.current) {
            fgRef.current.centerAt(match.x, match.y, 1000)
            fgRef.current.zoom(3, 1000)
            setHoverNode(match)
        }
    }, [data])

    // Custom node rendering with Solarpunk aesthetics
    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        // Determine if node should be visible based on bloom phase
        const getNodeVisibility = () => {
            if (node.isHub) return true // Hub always visible
            if (!isExpanded) return false // Everything hidden when collapsed

            // Polygon vertices - show when their cluster is revealed (1000+)
            if (node.isPolygonVertex) {
                const idx = parseInt(node.id.replace('__polygon_vertex_', '').replace('__', ''))
                return revealPhase >= 1000 + idx
            }

            // Cluster nodes - show when their cluster is revealed (1000+)
            if (node.clusterId !== undefined) {
                return revealPhase >= 1000 + node.clusterId
            }

            // Isolated nodes - show one by one (phases 1 to N)
            if (node.isIsolated) {
                const idx = node.isolatedIndex ?? 0
                return revealPhase >= 1 + idx
            }

            return isExpanded
        }

        const isVisible = getNodeVisibility()
        if (!isVisible) return // Don't render hidden nodes

        // Render polygon vertex nodes as small colored anchor points
        if (node.isPolygonVertex) {
            const vertexRadius = 4

            // Glow
            const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, vertexRadius * 3)
            gradient.addColorStop(0, nightMode ? 'rgba(211, 54, 130, 0.4)' : 'rgba(211, 54, 130, 0.3)') // Solarized magenta
            gradient.addColorStop(1, 'transparent')
            ctx.beginPath()
            ctx.arc(node.x, node.y, vertexRadius * 3, 0, 2 * Math.PI)
            ctx.fillStyle = gradient
            ctx.fill()

            // Core dot
            ctx.beginPath()
            ctx.arc(node.x, node.y, vertexRadius, 0, 2 * Math.PI)
            ctx.fillStyle = nightMode ? '#d33682' : '#d33682' // Solarized magenta
            ctx.fill()

            // Inner highlight
            ctx.beginPath()
            ctx.arc(node.x, node.y, vertexRadius - 1.5, 0, 2 * Math.PI)
            ctx.fillStyle = nightMode ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)'
            ctx.fill()

            return
        }

        const isHovered = hoverNode?.id === node.id
        const isHighlighted = highlightNodes.has(node.id)
        const isPinned = node.fx !== undefined && node.fx !== null && !node.isHub && !node.isPolygonVertex
        const isHub = node.isHub || node.id === '__grapheu_hub__'
        const isIsolated = node.isIsolated || ((node.weight === 0 || node.degree === 0) && !isHub)
        const label = node.label || ''
        const weight = node.weight || node.degree || 0

        // Special rendering for the central Hub (Solarpunk Sun)
        if (isHub) {
            const hubRadius = 25

            // Outer rays (sun pattern)
            const numRays = 12
            for (let i = 0; i < numRays; i++) {
                const angle = (i / numRays) * Math.PI * 2
                const rayLength = hubRadius + 15 + Math.sin(Date.now() / 500 + i) * 5
                const x1 = node.x + Math.cos(angle) * (hubRadius + 2)
                const y1 = node.y + Math.sin(angle) * (hubRadius + 2)
                const x2 = node.x + Math.cos(angle) * rayLength
                const y2 = node.y + Math.sin(angle) * rayLength

                ctx.beginPath()
                ctx.moveTo(x1, y1)
                ctx.lineTo(x2, y2)
                ctx.strokeStyle = nightMode ? 'rgba(181, 137, 0, 0.6)' : 'rgba(203, 75, 22, 0.5)'
                ctx.lineWidth = 2
                ctx.stroke()
            }

            // Outer glow
            const gradient = ctx.createRadialGradient(node.x, node.y, hubRadius * 0.3, node.x, node.y, hubRadius * 2)
            gradient.addColorStop(0, nightMode ? 'rgba(181, 137, 0, 0.4)' : 'rgba(203, 75, 22, 0.3)')
            gradient.addColorStop(0.5, nightMode ? 'rgba(181, 137, 0, 0.15)' : 'rgba(203, 75, 22, 0.1)')
            gradient.addColorStop(1, 'transparent')
            ctx.beginPath()
            ctx.arc(node.x, node.y, hubRadius * 2, 0, 2 * Math.PI)
            ctx.fillStyle = gradient
            ctx.fill()

            // Main sun circle
            ctx.beginPath()
            ctx.arc(node.x, node.y, hubRadius, 0, 2 * Math.PI)
            const sunGradient = ctx.createRadialGradient(node.x - 5, node.y - 5, 0, node.x, node.y, hubRadius)
            sunGradient.addColorStop(0, nightMode ? '#b58900' : '#cb4b16')
            sunGradient.addColorStop(1, nightMode ? '#856000' : '#a03810')
            ctx.fillStyle = sunGradient
            ctx.fill()

            // Inner ring
            ctx.beginPath()
            ctx.arc(node.x, node.y, hubRadius - 4, 0, 2 * Math.PI)
            ctx.strokeStyle = nightMode ? 'rgba(253, 246, 227, 0.3)' : 'rgba(253, 246, 227, 0.5)'
            ctx.lineWidth = 1
            ctx.stroke()

            // Hub sun symbol
            const hubZoomFactor = Math.pow(globalScale, 0.4)
            const sunFontSize = Math.max(Math.min(18 / hubZoomFactor, 30), 10)
            ctx.font = `600 ${sunFontSize}px 'IBM Plex Serif', Georgia, serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#fdf6e3'
            ctx.fillText('☀', node.x, node.y)

            // Label below
            if (globalScale > 0.3) {
                const labelFontSize = Math.max(Math.min(11 / hubZoomFactor, 18), 7)
                ctx.font = `600 ${labelFontSize}px 'IBM Plex Serif', Georgia, serif`
                ctx.textBaseline = 'top'
                ctx.strokeStyle = nightMode ? 'rgba(0,43,54,0.95)' : 'rgba(253,246,227,0.98)'
                ctx.lineWidth = Math.max(3 / hubZoomFactor, 1.5)
                ctx.strokeText('Grapheu', node.x, node.y + hubRadius + 6)
                ctx.fillStyle = nightMode ? '#b58900' : '#cb4b16'
                ctx.fillText('Grapheu', node.x, node.y + hubRadius + 6)
            }
            return
        }

        // Node radius
        const baseRadius = isIsolated ? 4 : (5 + Math.min(weight * 1.5, 12))
        const radius = baseRadius

        // Glow effect
        const glowRadius = radius + 6
        const glowColor = isIsolated
            ? (nightMode ? 'rgba(108, 113, 196, 0.3)' : 'rgba(108, 113, 196, 0.2)')
            : (nightMode ? 'rgba(42, 161, 152, 0.3)' : 'rgba(42, 161, 152, 0.2)')
        const gradient = ctx.createRadialGradient(node.x, node.y, radius * 0.5, node.x, node.y, glowRadius)
        gradient.addColorStop(0, glowColor)
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI)
        ctx.fillStyle = gradient
        ctx.fill()

        // Main circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)

        // Different colors for isolated vs connected nodes
        const nodeColor = isIsolated
            ? (nightMode ? '#6c71c4' : '#6c71c4') // Solarized violet for isolated
            : colors.node
        const hoverColor = isIsolated ? '#268bd2' : colors.nodeHover

        if (isHovered) {
            ctx.fillStyle = hoverColor
            ctx.shadowColor = hoverColor
            ctx.shadowBlur = 15
        } else {
            ctx.fillStyle = nodeColor
            ctx.shadowBlur = 0
        }
        ctx.fill()
        ctx.shadowBlur = 0

        // Pinned indicator
        if (isPinned) {
            ctx.beginPath()
            ctx.arc(node.x, node.y, 2, 0, 2 * Math.PI)
            ctx.fillStyle = nightMode ? '#fdf6e3' : '#073642'
            ctx.fill()
        }

        // Highlight ring
        if (isHovered || isHighlighted) {
            ctx.beginPath()
            ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI)
            ctx.strokeStyle = isHovered ? '#fff' : hoverColor
            ctx.lineWidth = isHovered ? 2 : 1.5
            ctx.stroke()
        }

        // Labels
        if (!showLabels) return

        // Smarter visibility based on zoom
        const shouldShowLabel = isHovered ||
            isHighlighted ||
            globalScale > 2 ||
            (weight > 3 && globalScale > 1) ||
            (weight > 5 && globalScale > 0.5)

        if (shouldShowLabel && label) {
            // Font size that maintains readable screen size
            // At zoom 1: base size, at zoom 0.5: ~1.5x base, at zoom 2: ~0.7x base
            const zoomFactor = Math.pow(globalScale, 0.5) // Dampened zoom effect
            const baseFontSize = isHovered ? 13 : (isHighlighted ? 11 : 10)
            const fontSize = Math.max(Math.min(baseFontSize / zoomFactor, 20), 6)

            ctx.font = `500 ${fontSize}px 'IBM Plex Serif', Georgia, serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'

            // Dynamic truncation based on zoom and importance
            let displayLabel = label
            const maxLen = isHovered ? 80 : (globalScale > 1.5 ? 50 : (globalScale > 0.8 ? 30 : 20))
            if (label.length > maxLen) {
                displayLabel = label.substring(0, maxLen - 1) + '…'
            }

            const textY = node.y + radius + 4

            // Outline thickness also scales
            ctx.strokeStyle = nightMode ? 'rgba(0,43,54,0.95)' : 'rgba(253,246,227,0.98)'
            ctx.lineWidth = Math.max(3 / zoomFactor, 1.5)
            ctx.lineJoin = 'round'
            ctx.strokeText(displayLabel, node.x, textY)

            ctx.fillStyle = isHovered ? colors.textHover : (isIsolated ? '#6c71c4' : colors.text)
            ctx.fillText(displayLabel, node.x, textY)
        }
    }, [hoverNode, highlightNodes, colors, nightMode, showLabels, isExpanded, revealPhase])

    // Controls
    const zoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 300)
    const zoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() / 1.3, 300)
    const resetView = () => { centerOnHub(); fgRef.current?.zoom(1.2, 400) }

    const toggleSimulation = () => {
        if (isSimulationRunning) {
            fgRef.current?.pauseAnimation()
        } else {
            fgRef.current?.resumeAnimation()
            fgRef.current?.d3ReheatSimulation()
        }
        setIsSimulationRunning(!isSimulationRunning)
    }

    // Focus on a specific node
    const focusOnNode = useCallback((nodeId: string) => {
        const node = data?.nodes.find((n: any) => n.id === nodeId)
        if (node && fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000)
            fgRef.current.zoom(3, 1000)
            setHoverNode(node as GraphNode)
        }
    }, [data])

    // Get isolated nodes for the panel
    const isolatedNodes = useMemo(() => {
        if (!data) return []
        return (data as any).nodes?.filter((n: any) =>
            (n.weight === 0 || n.degree === 0) &&
            !n.isHub &&
            n.id !== '__grapheu_hub__'
        ) || []
    }, [data])

    const graphData = useMemo(() => data, [data])

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-full ${className}`} style={{ background: colors.bg }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.node }} />
                <span className="ml-3" style={{ color: colors.text }}>Chargement du graphe...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center h-full ${className}`} style={{ background: colors.bg }}>
                <span style={{ color: '#dc322f' }}>{error}</span>
            </div>
        )
    }

    return (
        <div
            className={`relative ${className}`}
            style={{
                background: colors.bg,
                opacity: false ? 0.5 : 1,
                transition: 'opacity 0.3s ease',
            }}
        >
            {/* Graph */}
            {graphData && dimensions.width > 0 && (
                <ForceGraph2D
                    ref={fgRef}
                    graphData={graphData as any}
                    width={dimensions.width}
                    height={dimensions.height}
                    backgroundColor={colors.bg}
                    nodeLabel=""
                    nodeCanvasObject={nodeCanvasObject}
                    nodePointerAreaPaint={(node: any, color, ctx) => {
                        const radius = 5 + Math.min(node.weight || 1, 12)
                        ctx.fillStyle = color
                        ctx.beginPath()
                        ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI)
                        ctx.fill()
                    }}
                    linkColor={(link: any) => {
                        // Hide links when collapsed
                        if (!isExpanded) return 'transparent'

                        const source = typeof link.source === 'object' ? link.source : null
                        const target = typeof link.target === 'object' ? link.target : null

                        // Helper to check if a node is visible
                        const isNodeVisible = (node: any) => {
                            if (!node) return false
                            if (node.isHub) return true
                            if (node.isPolygonVertex) {
                                const idx = parseInt(node.id?.replace('__polygon_vertex_', '').replace('__', '') || '0')
                                return revealPhase >= 1000 + idx
                            }
                            if (node.clusterId !== undefined) {
                                return revealPhase >= 1000 + node.clusterId
                            }
                            if (node.isIsolated) {
                                const idx = node.isolatedIndex ?? 0
                                return revealPhase >= 1 + idx
                            }
                            return isExpanded
                        }

                        // Only show link if both endpoints are visible
                        if (!isNodeVisible(source) || !isNodeVisible(target)) {
                            return 'transparent'
                        }

                        const linkType = link.type
                        // Polygon edges: very subtle
                        if (linkType === 'POLYGON_EDGE') {
                            return nightMode ? 'rgba(88, 110, 117, 0.3)' : 'rgba(147, 161, 161, 0.25)'
                        }
                        // Hub to vertex: subtle connecting lines
                        if (linkType === 'HUB_TO_VERTEX') {
                            return nightMode ? 'rgba(181, 137, 0, 0.2)' : 'rgba(203, 75, 22, 0.15)'
                        }
                        // Hub to isolated nodes: violet tint
                        if (linkType === 'HUB_LINK') {
                            return nightMode ? 'rgba(108, 113, 196, 0.35)' : 'rgba(108, 113, 196, 0.25)'
                        }
                        // Cluster anchor links: very subtle
                        if (linkType === 'CLUSTER_ANCHOR') {
                            return nightMode ? 'rgba(42, 161, 152, 0.15)' : 'rgba(42, 161, 152, 0.1)'
                        }
                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target
                        const isHighlighted = highlightNodes.has(sourceId) && highlightNodes.has(targetId)
                        return isHighlighted ? colors.linkHighlight : colors.link
                    }}
                    linkWidth={(link: any) => {
                        const linkType = link.type
                        // Polygon edges: thin
                        if (linkType === 'POLYGON_EDGE') return 0.5
                        if (linkType === 'HUB_TO_VERTEX') return 0.3
                        if (linkType === 'HUB_LINK') return 0.5
                        if (linkType === 'CLUSTER_ANCHOR') return 0.2

                        const sourceId = typeof link.source === 'object' ? link.source.id : link.source
                        const targetId = typeof link.target === 'object' ? link.target.id : link.target
                        const isHighlighted = highlightNodes.has(sourceId) && highlightNodes.has(targetId)
                        return isHighlighted ? 2.5 : 1
                    }}
                    onNodeHover={handleNodeHover}
                    onNodeClick={handleNodeClick}
                    onNodeDragEnd={handleNodeDragEnd}
                    enableNodeDrag={true}
                    cooldownTicks={100}
                    d3AlphaDecay={0.12}
                    d3VelocityDecay={0.3}
                    d3AlphaMin={0.001}
                    warmupTicks={50}
                />
            )}

            {/* Info Panel - Hidden in background mode */}
            {!false && <div className="absolute top-20 left-4 z-10 flex flex-col gap-2 w-80">

                {hoverNode && (
                    <div
                        className="rounded-xl p-4 backdrop-blur-md shadow-lg"
                        style={{
                            background: nightMode ? 'rgba(0,43,54,0.95)' : 'rgba(253,246,227,0.98)',
                            color: colors.text,
                            border: `1px solid ${nightMode ? 'rgba(42,161,152,0.3)' : 'rgba(42,161,152,0.2)'}`,
                        }}
                    >
                        <div className="font-semibold text-base leading-snug" style={{ color: colors.textHover }}>
                            {hoverNode.label}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                    background: nightMode ? 'rgba(42,161,152,0.2)' : 'rgba(42,161,152,0.15)',
                                    color: colors.node,
                                }}
                            >
                                {hoverNode.weight || hoverNode.degree || 0} connexions
                            </span>
                        </div>
                        {(hoverNode.url || hoverNode.id?.startsWith('billet:')) && (
                            <div
                                className="text-xs mt-3 pt-2 flex items-center gap-1"
                                style={{
                                    borderTop: `1px solid ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                    color: colors.nodeHover,
                                }}
                            >
                                <span>→</span> Cliquer pour lire
                            </div>
                        )}
                    </div>
                )}
            </div>}



            {/* Settings Panel - Slide-in from Right - Hidden in background mode */}
            {!false && showSettings && (
                <div
                    className="fixed inset-0 z-20"
                    onClick={() => setShowSettings(false)}
                />
            )}
            {!false && <div
                className="fixed right-0 z-30 transition-transform duration-300 ease-out"
                style={{
                    top: 0,
                    height: '100vh',
                    transform: showSettings ? 'translateX(0)' : 'translateX(100%)',
                    width: '300px',
                }}
            >
                <div
                    className="h-full overflow-y-auto"
                    style={{
                        background: nightMode ? '#073642' : '#eee8d5',
                    }}
                >
                    {/* Header */}
                    <div
                        className="sticky top-0 flex items-center justify-between px-5 py-4 z-10"
                        style={{
                            background: nightMode ? '#073642' : '#eee8d5',
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <Settings2 className="w-4 h-4" style={{ color: colors.node }} />
                            <span className="font-semibold text-sm" style={{ color: colors.textHover }}>
                                Paramètres
                            </span>
                        </div>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                            style={{
                                background: nightMode ? 'rgba(42,161,152,0.2)' : 'rgba(42,161,152,0.15)',
                                color: '#2aa198',
                            }}
                            title="Fermer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-5 space-y-6">

                        {/* Structure Section */}
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2"
                                style={{ color: nightMode ? 'rgba(147,161,161,0.7)' : 'rgba(101,123,131,0.8)' }}>
                                <span>◇</span> Structure
                            </div>

                            <div className="space-y-4">
                                {/* Polygon Radius */}
                                <div className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm" style={{ color: colors.text }}>
                                            Distance des grappes
                                        </label>
                                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                                            style={{ background: nightMode ? 'rgba(42,161,152,0.2)' : 'rgba(42,161,152,0.1)', color: '#2aa198' }}>
                                            {forces.polygonRadius}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="100"
                                        max="500"
                                        step="10"
                                        value={forces.polygonRadius}
                                        onChange={e => setForces(f => ({ ...f, polygonRadius: Number(e.target.value) }))}
                                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #2aa198 0%, #2aa198 ${(forces.polygonRadius - 100) / 4}%, ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} ${(forces.polygonRadius - 100) / 4}%, ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 100%)`,
                                        }}
                                    />
                                </div>

                                {/* Link Distance */}
                                <div className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm" style={{ color: colors.text }}>
                                            Distance des liens
                                        </label>
                                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                                            style={{ background: nightMode ? 'rgba(42,161,152,0.2)' : 'rgba(42,161,152,0.1)', color: '#2aa198' }}>
                                            {forces.linkDistance}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="200"
                                        value={forces.linkDistance}
                                        onChange={e => setForces(f => ({ ...f, linkDistance: Number(e.target.value) }))}
                                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #2aa198 0%, #2aa198 ${(forces.linkDistance - 10) / 1.9}%, ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} ${(forces.linkDistance - 10) / 1.9}%, ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 100%)`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Physics Section */}
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2"
                                style={{ color: nightMode ? 'rgba(147,161,161,0.7)' : 'rgba(101,123,131,0.8)' }}>
                                <span>⚡</span> Physique
                            </div>

                            <div className="space-y-4">
                                {/* Charge Strength */}
                                <div className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm" style={{ color: colors.text }}>
                                            Répulsion
                                        </label>
                                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                                            style={{ background: nightMode ? 'rgba(42,161,152,0.2)' : 'rgba(42,161,152,0.1)', color: '#2aa198' }}>
                                            {Math.abs(forces.chargeStrength)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-500"
                                        max="-10"
                                        value={forces.chargeStrength}
                                        onChange={e => setForces(f => ({ ...f, chargeStrength: Number(e.target.value) }))}
                                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #2aa198 0%, #2aa198 ${(500 + forces.chargeStrength) / 4.9}%, ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} ${(500 + forces.chargeStrength) / 4.9}%, ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 100%)`,
                                        }}
                                    />
                                </div>

                                {/* Collision Radius */}
                                <div className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm" style={{ color: colors.text }}>
                                            Rayon de collision
                                        </label>
                                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                                            style={{ background: nightMode ? 'rgba(42,161,152,0.2)' : 'rgba(42,161,152,0.1)', color: '#2aa198' }}>
                                            {forces.collisionRadius}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="5"
                                        max="50"
                                        value={forces.collisionRadius}
                                        onChange={e => setForces(f => ({ ...f, collisionRadius: Number(e.target.value) }))}
                                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #2aa198 0%, #2aa198 ${(forces.collisionRadius - 5) / 0.45}%, ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} ${(forces.collisionRadius - 5) / 0.45}%, ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 100%)`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Display Section */}
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2"
                                style={{ color: nightMode ? 'rgba(147,161,161,0.7)' : 'rgba(101,123,131,0.8)' }}>
                                <span>◉</span> Affichage
                            </div>

                            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl transition-all hover:scale-[1.02]"
                                style={{ background: nightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                                <span className="text-sm" style={{ color: colors.text }}>Labels visibles</span>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={showLabels}
                                        onChange={e => setShowLabels(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 rounded-full transition-colors peer-checked:bg-[#2aa198]"
                                        style={{ background: nightMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>}

            {/* Controls - Hidden in background mode */}
            {!false && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 items-center">
                <button
                    onClick={() => setNightMode(n => !n)}
                    className="p-2.5 rounded-xl transition-all hover:scale-105"
                    style={{
                        background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: colors.text,
                    }}
                    title={nightMode ? 'Mode jour' : 'Mode nuit'}
                >
                    {nightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                    onClick={() => setShowSettings(s => !s)}
                    className="p-2.5 rounded-xl transition-all hover:scale-105"
                    style={{
                        background: showSettings
                            ? (nightMode ? 'rgba(42,161,152,0.3)' : 'rgba(42,161,152,0.2)')
                            : (nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                        color: colors.text,
                    }}
                    title="Paramètres"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            </div>}

            {/* Isolated Nodes Panel - Also hidden in background mode */}
            {!false && showIsolated && isolatedNodes.length > 0 && (
                <div
                    className="absolute top-20 right-4 z-20 w-72 max-h-[60vh] overflow-y-auto rounded-xl backdrop-blur-md shadow-xl"
                    style={{
                        background: nightMode ? 'rgba(0,43,54,0.95)' : 'rgba(253,246,227,0.98)',
                        border: `1px solid ${nightMode ? 'rgba(108,113,196,0.3)' : 'rgba(108,113,196,0.2)'}`,
                    }}
                >
                    <div
                        className="sticky top-0 p-4 flex items-center justify-between"
                        style={{
                            background: nightMode ? 'rgba(0,43,54,0.98)' : 'rgba(253,246,227,0.98)',
                            borderBottom: `1px solid ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ background: '#6c71c4' }}
                            />
                            <span className="font-semibold text-sm" style={{ color: colors.textHover }}>
                                Billets isolés
                            </span>
                            <span
                                className="text-xs px-1.5 py-0.5 rounded-full"
                                style={{
                                    background: nightMode ? 'rgba(108,113,196,0.2)' : 'rgba(108,113,196,0.15)',
                                    color: '#6c71c4',
                                }}
                            >
                                {isolatedNodes.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setShowIsolated(false)}
                            className="opacity-60 hover:opacity-100"
                        >
                            <X className="w-4 h-4" style={{ color: colors.text }} />
                        </button>
                    </div>
                    <div className="p-2">
                        {isolatedNodes.map((node: any) => (
                            <button
                                key={node.id}
                                onClick={() => {
                                    focusOnNode(node.id)
                                    setShowIsolated(false)
                                }}
                                className="w-full text-left p-3 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                style={{ color: colors.text }}
                            >
                                <div className="text-sm font-medium line-clamp-2" style={{ color: '#6c71c4' }}>
                                    {node.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats - Hidden in background mode */}
            {!false && <div
                className="absolute bottom-4 left-4 text-xs px-3 py-2 rounded-xl flex items-center gap-3"
                style={{
                    background: nightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    color: colors.text,
                    border: `1px solid ${nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                }}
            >
                <span>{data?.nodes.length} nœuds</span>
                <span className="opacity-40">•</span>
                <span>{(data as any)?.links?.length || 0} liens</span>
                {isolatedNodes.length > 0 && (
                    <>
                        <span className="opacity-40">•</span>
                        <button
                            onClick={() => setShowIsolated(s => !s)}
                            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                            style={{ color: showIsolated ? '#6c71c4' : colors.text }}
                        >
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: '#6c71c4' }}
                            />
                            {isolatedNodes.length} isolés
                        </button>
                    </>
                )}
            </div>}
        </div>
    )
}
