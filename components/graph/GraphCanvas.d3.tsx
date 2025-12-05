'use client'

/**
 * GraphCanvas - Fullscreen knowledge graph visualization
 * Overhaul: Screen-space text rendering for sharpness + Fit View logic
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GraphNode, GraphEdge, GraphData, DEFAULT_CONFIG } from '@/lib/graph/types'
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

    // State
    const [data, setData] = useState<GraphData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)
    const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set())
    const [nightMode, setNightMode] = useState(initialNightMode)
    const [searchQuery, setSearchQuery] = useState('')
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

    // Refs
    const nodesRef = useRef<GraphNode[]>([])
    const edgesRef = useRef<GraphEdge[]>([])
    const rafRef = useRef<number>(0)
    const isDraggingRef = useRef(false)
    const lastMouseRef = useRef({ x: 0, y: 0 })
    const simulationStopRef = useRef<(() => void) | null>(null)
    const isFirstLayoutRef = useRef(true)

    const colors = nightMode ? COLORS.dark : COLORS.light
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    // 1. Setup canvas size based on window with HiDPI support
    useEffect(() => {
        const updateSize = () => {
            const width = window.innerWidth
            const height = window.innerHeight
            const ratio = window.devicePixelRatio || 1

            setCanvasSize({ width, height })

            const canvas = canvasRef.current
            if (canvas) {
                // Set canvas buffer size (for crisp rendering)
                canvas.width = width * ratio
                canvas.height = height * ratio
                // Set canvas display size
                canvas.style.width = width + 'px'
                canvas.style.height = height + 'px'
                // Scale context to match
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.scale(ratio, ratio)
                }
            }
        }

        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    // 2. Load data
    useEffect(() => {
        fetchGraphData()
            .then(graphData => {
                setData(graphData)
                edgesRef.current = graphData.edges
                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to load graph:', err)
                setError('Impossible de charger le graphe')
                setLoading(false)
            })
    }, [])

    // Helper: Fit view to content
    const fitView = useCallback(() => {
        const nodes = nodesRef.current
        const canvas = canvasRef.current
        if (!canvas || nodes.length === 0) return

        // Calculate bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        nodes.forEach(n => {
            if (n.x === undefined || n.y === undefined) return
            minX = Math.min(minX, n.x)
            minY = Math.min(minY, n.y)
            maxX = Math.max(maxX, n.x)
            maxY = Math.max(maxY, n.y)
        })

        if (minX === Infinity) return

        const contentWidth = maxX - minX
        const contentHeight = maxY - minY
        const padding = 100

        // Calculate zoom to fit
        const scaleX = (canvasSize.width - padding * 2) / contentWidth
        const scaleY = (canvasSize.height - padding * 2) / contentHeight
        const newZoom = Math.min(scaleX, scaleY, 1) // Don't zoom in too much initially

        // Center point of content
        const cx = (minX + maxX) / 2
        const cy = (minY + maxY) / 2

        // Pan to center
        // targetPan = center of screen - (center of content * zoom)
        const newPanX = canvasSize.width / 2 - cx * newZoom
        const newPanY = canvasSize.height / 2 - cy * newZoom

        setZoom(newZoom)
        setPan({ x: newPanX, y: newPanY })
    }, [canvasSize])

    // 3. Setup simulation
    useEffect(() => {
        if (!data || canvasSize.width === 0 || canvasSize.height === 0) return

        if (simulationStopRef.current) {
            simulationStopRef.current()
        }

        const centerX = canvasSize.width / 2
        const centerY = canvasSize.height / 2

        // Initialize positions if needed
        const scaledNodes = data.nodes.map(n => {
            if (n.x !== undefined && n.y !== undefined) {
                return { ...n, x: n.x + centerX, y: n.y + centerY } // Simple shift
            }
            return {
                ...n,
                x: centerX + (Math.random() - 0.5) * 50,
                y: centerY + (Math.random() - 0.5) * 50,
            }
        })

        nodesRef.current = scaledNodes

        const { stop } = createLiveSimulation(
            scaledNodes,
            data.edges,
            {
                width: canvasSize.width,
                height: canvasSize.height,
                chargeStrength: -1500,
                linkDistance: 250,
                collisionMultiplier: 8,
            },
            (nodes) => {
                nodesRef.current = nodes
                // Auto-fit on first stabilization/tick could be jarring, 
                // but let's do it once after a few frames if it's the first load
                if (isFirstLayoutRef.current) {
                    // fitView() - might be too early, user can click button
                    isFirstLayoutRef.current = false
                }
            }
        )

        simulationStopRef.current = stop

        // Initial fit after a delay to let simulation settle a bit
        setTimeout(fitView, 500)

        return () => {
            if (simulationStopRef.current) {
                simulationStopRef.current()
            }
        }
    }, [data, canvasSize]) // Removed fitView dependency to avoid loops

    // 4. Render loop
    const render = useCallback(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx || canvas.width === 0) {
            rafRef.current = requestAnimationFrame(render)
            return
        }

        const { width, height } = canvasSize // Use logical size
        // Note: ctx is already scaled by dpr

        // Clear (logical coords)
        ctx.fillStyle = colors.bg
        ctx.fillRect(0, 0, width, height)

        /* --- WORLD SPACE RENDERING (Edges & Nodes) --- */
        ctx.save()
        ctx.translate(pan.x, pan.y)
        ctx.scale(zoom, zoom)

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

            // Node visual radius
            const baseRadius = 5 + Math.min(node.weight, 10)
            const radius = baseRadius / Math.pow(zoom, 0.5) // Gentle scaling

            // Glow
            if (node.weight >= 2) {
                ctx.beginPath()
                ctx.arc(node.x, node.y, radius * 1.4, 0, Math.PI * 2)
                ctx.fillStyle = nightMode ? 'rgba(42, 161, 152, 0.15)' : 'rgba(42, 161, 152, 0.1)'
                ctx.fill()
            }

            // Circle
            ctx.beginPath()
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
            ctx.fillStyle = isHovered ? colors.nodeHover : colors.node
            ctx.fill()

            // Highlight
            if (isHovered || isHighlighted) {
                ctx.beginPath()
                ctx.arc(node.x, node.y, radius + 2 / zoom, 0, Math.PI * 2)
                ctx.strokeStyle = colors.nodeHover
                ctx.lineWidth = 2 / zoom
                ctx.stroke()
            }
        })

        ctx.restore()
        /* --- END WORLD SPACE --- */

        /* --- SCREEN SPACE RENDERING (Text) --- */
        // Now drawing in screen coordinates (logical pixels)
        // Guaranteed sharp text
        nodes.forEach(node => {
            if (!node.x || !node.y) return

            const isHovered = hoveredNode?.id === node.id
            const isHighlighted = highlightedIds.has(node.id)

            // Re-calculate screen position
            const screenX = node.x * zoom + pan.x
            const screenY = node.y * zoom + pan.y

            // Culling - check if off screen
            if (screenX < -100 || screenX > width + 100 || screenY < -100 || screenY > height + 100) return

            // Visibility logic
            const showLabel = isHovered || isHighlighted ||
                (zoom > 0.6) ||
                (node.weight > 5 && zoom > 0.4)

            if (showLabel) {
                let label = node.label
                const maxLen = isHovered ? 50 : 25
                if (label.length > maxLen) {
                    label = label.substring(0, maxLen - 1) + '…'
                }

                const baseRadius = 5 + Math.min(node.weight, 10)
                const nodeRadius = baseRadius / Math.pow(zoom, 0.5)
                const scaledRadius = nodeRadius * zoom // actual screen size of node

                const fontSize = isHovered ? 14 : 12
                ctx.font = `${fontSize}px 'IBM Plex Serif', Georgia, serif`
                ctx.textAlign = 'center'
                ctx.textBaseline = 'top'

                const textY = screenY + scaledRadius + 4

                ctx.strokeStyle = nightMode ? '#002b36' : '#fdf6e3'
                ctx.lineWidth = 3
                ctx.lineJoin = 'round'
                ctx.strokeText(label, screenX, textY)

                ctx.fillStyle = isHovered ? colors.textHover : colors.text
                ctx.fillText(label, screenX, textY)
            }
        })

        rafRef.current = requestAnimationFrame(render)
    }, [zoom, pan, hoveredNode, highlightedIds, colors, nightMode, canvasSize])

    // Loop logic
    useEffect(() => {
        rafRef.current = requestAnimationFrame(render)
        return () => cancelAnimationFrame(rafRef.current)
    }, [render])

    // Interactions
    const screenToGraph = useCallback((screenX: number, screenY: number) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }
        // Simple inverse, rect.left/top usually 0 in fullscreen
        return {
            x: (screenX - pan.x) / zoom,
            y: (screenY - pan.y) / zoom,
        }
    }, [zoom, pan])

    const findNodeAt = useCallback((graphX: number, graphY: number): GraphNode | null => {
        const nodes = nodesRef.current
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i]
            if (!node.x || !node.y) continue
            // Hit testing needs to account for visual size
            const baseRadius = 5 + Math.min(node.weight, 10)
            const radius = baseRadius / Math.pow(zoom, 0.5)

            const dx = graphX - node.x
            const dy = graphY - node.y
            if (dx * dx + dy * dy < radius * radius * 4) { // Generous hit area
                return node
            }
        }
        return null
    }, [zoom])

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
        // Infinite zoom but clamped to sane values for safety
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setZoom(z => Math.max(0.01, Math.min(10, z * delta)))
    }, [])

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query)
        if (!data) return
        const found = searchNodes(query, data.nodes)
        if (found && found.x && found.y) {
            const targetZoom = 2
            setPan({
                x: canvasSize.width / 2 - found.x * targetZoom,
                y: canvasSize.height / 2 - found.y * targetZoom,
            })
            setZoom(targetZoom)
            setHoveredNode(found)
            setHighlightedIds(getNeighborIds(found.id, data.edges))
        }
    }, [data, canvasSize])

    const zoomIn = () => setZoom(z => Math.min(10, z * 1.3))
    const zoomOut = () => setZoom(z => Math.max(0.01, z / 1.3))

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
        <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ background: colors.bg }}>
            <canvas
                ref={canvasRef}
                className="block cursor-grab active:cursor-grabbing"
                style={{ width: '100%', height: '100%' }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleClick}
                onWheel={handleWheel}
            />

            {/* Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 w-64">
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
                        }}
                    />
                </div>

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

            {/* Bottom controls */}
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                <button onClick={() => setNightMode(n => !n)} className="p-2 rounded-lg" style={{ background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}>
                    {nightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={fitView} className="p-2 rounded-lg" style={{ background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}>
                    <Maximize2 className="w-5 h-5" />
                </button>
                <button onClick={zoomOut} className="p-2 rounded-lg" style={{ background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}>
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button onClick={zoomIn} className="p-2 rounded-lg" style={{ background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}>
                    <ZoomIn className="w-5 h-5" />
                </button>
            </div>

            {/* Zoom indicator */}
            <div className="absolute bottom-4 left-4 text-xs px-2 py-1 rounded" style={{ background: nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}>
                {Math.round(zoom * 100)}%
            </div>
        </div>
    )
}
