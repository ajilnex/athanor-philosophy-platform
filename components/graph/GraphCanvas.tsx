'use client'

/**
 * GraphCanvas - Main knowledge graph visualization component
 * Uses Canvas 2D for performance, d3-force for layout
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GraphNode, GraphEdge, GraphData, GraphConfig, DEFAULT_CONFIG } from '@/lib/graph/types'
import { fetchGraphData, getNeighborIds, searchNodes } from '@/lib/graph/data-source'
import { createLiveSimulation } from '@/lib/graph/layout-engine'
import { Loader2, Search, Moon, Sun, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

// Solarized colors
const COLORS = {
    light: {
        bg: '#fdf6e3',
        node: '#2aa198',
        nodeHover: '#268bd2',
        link: 'rgba(147, 161, 161, 0.3)',
        linkHighlight: 'rgba(38, 139, 210, 0.6)',
        text: '#657b83',
        textHover: '#073642',
    },
    dark: {
        bg: '#002b36',
        node: '#2aa198',
        nodeHover: '#268bd2',
        link: 'rgba(88, 110, 117, 0.3)',
        linkHighlight: 'rgba(38, 139, 210, 0.6)',
        text: '#93a1a1',
        textHover: '#fdf6e3',
    },
}

interface GraphCanvasProps {
    className?: string
    initialNightMode?: boolean
}

export function GraphCanvas({ className = '', initialNightMode = false }: GraphCanvasProps) {
    const router = useRouter()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Data state
    const [data, setData] = useState<GraphData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // View state
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
    const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set())
    const [nightMode, setNightMode] = useState(initialNightMode)
    const [searchQuery, setSearchQuery] = useState('')

    // Refs for animation
    const nodesRef = useRef<GraphNode[]>([])
    const edgesRef = useRef<GraphEdge[]>([])
    const rafRef = useRef<number>(0)
    const isDraggingRef = useRef(false)
    const lastMouseRef = useRef({ x: 0, y: 0 })

    const colors = nightMode ? COLORS.dark : COLORS.light

    // Load data
    useEffect(() => {
        fetchGraphData()
            .then(graphData => {
                setData(graphData)
                nodesRef.current = graphData.nodes
                edgesRef.current = graphData.edges
                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to load graph:', err)
                setError('Impossible de charger le graphe')
                setLoading(false)
            })
    }, [])

    // Setup simulation when data loads
    useEffect(() => {
        if (!data || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const { simulation, stop } = createLiveSimulation(
            data.nodes,
            data.edges,
            { width: rect.width, height: rect.height },
            (nodes) => {
                nodesRef.current = nodes
            }
        )

        return () => stop()
    }, [data])

    // Canvas rendering
    const render = useCallback(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) return

        const { width, height } = canvas

        // Clear
        ctx.fillStyle = colors.bg
        ctx.fillRect(0, 0, width, height)

        // Apply transform
        ctx.save()
        ctx.translate(width / 2 + pan.x, height / 2 + pan.y)
        ctx.scale(zoom, zoom)
        ctx.translate(-width / 2, -height / 2)

        const nodes = nodesRef.current
        const edges = edgesRef.current

        // Draw edges
        edges.forEach(edge => {
            const source = typeof edge.source === 'object' ? edge.source : nodes.find(n => n.id === edge.source)
            const target = typeof edge.target === 'object' ? edge.target : nodes.find(n => n.id === edge.target)

            if (!source?.x || !target?.x) return

            const isHighlighted = highlightedIds.has(source.id) && highlightedIds.has(target.id)

            ctx.beginPath()
            ctx.moveTo(source.x, source.y!)
            ctx.lineTo(target.x, target.y!)
            ctx.strokeStyle = isHighlighted ? colors.linkHighlight : colors.link
            ctx.lineWidth = isHighlighted ? 1.5 / zoom : 1 / zoom
            ctx.stroke()
        })

        // Draw nodes
        nodes.forEach(node => {
            if (!node.x || !node.y) return

            const isHovered = hoveredNode?.id === node.id
            const isHighlighted = highlightedIds.has(node.id)
            const radius = (DEFAULT_CONFIG.nodeRadius + node.weight) / zoom

            // Node circle
            ctx.beginPath()
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
            ctx.fillStyle = isHovered ? colors.nodeHover : colors.node
            ctx.fill()

            // Highlight ring
            if (isHovered || isHighlighted) {
                ctx.beginPath()
                ctx.arc(node.x, node.y, radius + 3 / zoom, 0, Math.PI * 2)
                ctx.strokeStyle = colors.nodeHover
                ctx.lineWidth = 2 / zoom
                ctx.stroke()
            }

            // Label (show when zoomed or hovered)
            if (zoom > DEFAULT_CONFIG.labelZoomThreshold || isHovered || node.weight > 5) {
                ctx.font = `${12 / zoom}px system-ui, sans-serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'top'
                ctx.fillStyle = isHovered ? colors.textHover : colors.text
                ctx.fillText(node.label, node.x, node.y + radius + 4 / zoom)
            }
        })

        ctx.restore()

        rafRef.current = requestAnimationFrame(render)
    }, [zoom, pan, hoveredNode, highlightedIds, colors])

    // Start render loop
    useEffect(() => {
        rafRef.current = requestAnimationFrame(render)
        return () => cancelAnimationFrame(rafRef.current)
    }, [render])

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current
            const container = containerRef.current
            if (!canvas || !container) return

            const rect = container.getBoundingClientRect()
            canvas.width = rect.width
            canvas.height = rect.height
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Screen to graph coordinates
    const screenToGraph = useCallback((screenX: number, screenY: number) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }

        const rect = canvas.getBoundingClientRect()
        const x = (screenX - rect.left - rect.width / 2 - pan.x) / zoom + rect.width / 2
        const y = (screenY - rect.top - rect.height / 2 - pan.y) / zoom + rect.height / 2
        return { x, y }
    }, [zoom, pan])

    // Find node at position
    const findNodeAt = useCallback((graphX: number, graphY: number): GraphNode | null => {
        const nodes = nodesRef.current
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i]
            if (!node.x || !node.y) continue
            const radius = DEFAULT_CONFIG.nodeRadius + node.weight
            const dx = graphX - node.x
            const dy = graphY - node.y
            if (dx * dx + dy * dy < radius * radius * 4) {
                return node
            }
        }
        return null
    }, [])

    // Mouse handlers
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDraggingRef.current) {
            const dx = e.clientX - lastMouseRef.current.x
            const dy = e.clientY - lastMouseRef.current.y
            setPan(p => ({ x: p.x + dx, y: p.y + dy }))
            lastMouseRef.current = { x: e.clientX, y: e.clientY }
            return
        }

        const { x, y } = screenToGraph(e.clientX, e.clientY)
        const node = findNodeAt(x, y)

        if (node !== hoveredNode) {
            setHoveredNode(node)
            if (node && data) {
                setHighlightedIds(getNeighborIds(node.id, data.edges))
            } else {
                setHighlightedIds(new Set())
            }
        }
    }, [screenToGraph, findNodeAt, hoveredNode, data])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDraggingRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
    }, [])

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false
    }, [])

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (isDraggingRef.current) return

        const { x, y } = screenToGraph(e.clientX, e.clientY)
        const node = findNodeAt(x, y)

        if (node && node.type === 'BILLET' && node.slug) {
            router.push(`/billets/${node.slug}`)
        }
    }, [screenToGraph, findNodeAt, router])

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom(z => Math.max(0.2, Math.min(5, z * delta)))
    }, [])

    // Search
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query)
        if (!data) return

        const found = searchNodes(query, data.nodes)
        if (found && found.x && found.y) {
            const canvas = canvasRef.current
            if (!canvas) return

            setPan({
                x: canvas.width / 2 - found.x * zoom,
                y: canvas.height / 2 - found.y * zoom,
            })
            setZoom(2)
            setHoveredNode(found)
            setHighlightedIds(getNeighborIds(found.id, data.edges))
        }
    }, [data, zoom])

    // Zoom controls
    const zoomIn = () => setZoom(z => Math.min(5, z * 1.3))
    const zoomOut = () => setZoom(z => Math.max(0.2, z / 1.3))
    const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-full ${className}`} style={{ background: colors.bg }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.node }} />
                <span className="ml-2" style={{ color: colors.text }}>Chargement du graphe...</span>
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
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`} style={{ background: colors.bg }}>
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
                onWheel={handleWheel}
            />

            {/* Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 w-64">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text }} />
                    <input
                        type="text"
                        placeholder="Chercher un billet..."
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        className="w-full rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2"
                        style={{
                            background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            color: colors.text,
                            borderColor: 'transparent',
                        }}
                    />
                </div>

                {/* Hovered node info */}
                {hoveredNode && (
                    <div
                        className="rounded-lg p-3 backdrop-blur-sm"
                        style={{
                            background: nightMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                            color: colors.text,
                        }}
                    >
                        <div className="font-semibold" style={{ color: colors.textHover }}>{hoveredNode.label}</div>
                        <div className="text-xs uppercase opacity-60">{hoveredNode.type}</div>
                    </div>
                )}
            </div>

            {/* Right controls */}
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                <button
                    onClick={() => setNightMode(n => !n)}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                        background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: colors.text,
                    }}
                >
                    {nightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                    onClick={resetView}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                        background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: colors.text,
                    }}
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
                <button
                    onClick={zoomOut}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                        background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: colors.text,
                    }}
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button
                    onClick={zoomIn}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                        background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: colors.text,
                    }}
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
            </div>

            {/* Zoom indicator */}
            <div
                className="absolute bottom-4 left-4 text-xs px-2 py-1 rounded"
                style={{
                    background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: colors.text,
                }}
            >
                {Math.round(zoom * 100)}%
            </div>
        </div>
    )
}
