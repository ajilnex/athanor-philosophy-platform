'use client'

/**
 * ForceGraphCanvas - Obsidian-style knowledge graph for Billets
 * Refactored to use shared graph modules
 */

import { useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
    Loader2, Search, Moon, Sun, ZoomIn, ZoomOut, Maximize2,
    Settings2, X, RotateCcw, Sparkles
} from 'lucide-react'

// Shared graph modules
import { GraphNode, GraphData, GRAPH_COLORS, ForceSettings } from './types'
import { useForceGraph } from './hooks/useForceGraph'
import { processGraphData, configureForces } from './utils'

// Dynamic import to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

interface ForceGraphCanvasProps {
    className?: string
    backgroundMode?: boolean
}

export function ForceGraphCanvas({ className = '', backgroundMode = false }: ForceGraphCanvasProps) {
    const router = useRouter()

    // Use shared hook for all common state and handlers
    const graph = useForceGraph({
        hubId: '__athanor_hub__',
        hubLabel: 'Athanor',
        hubPosition: { x: 0, y: 0 },
        initialExpanded: backgroundMode,
        onNodeClick: (node) => {
            // Navigate to billet when clicking non-hub nodes
            if (node.url) {
                router.push(node.url)
            } else if (node.id?.startsWith('billet:')) {
                const slug = node.id.replace('billet:', '')
                router.push(`/billets/${slug}`)
            }
        },
    })

    const colors = graph.nightMode ? GRAPH_COLORS.dark : GRAPH_COLORS.light

    // Load graph data from static JSON
    useEffect(() => {
        fetch('/graph-billets.json')
            .then(res => res.json())
            .then((rawData: GraphData) => {
                const processed = processGraphData({
                    nodes: rawData.nodes || [],
                    edges: (rawData as any).edges || [],
                    hubId: '__athanor_hub__',
                    hubLabel: 'Athanor',
                    hubPosition: { x: 0, y: 0 },
                    polygonRadius: graph.forces.polygonRadius,
                })
                graph.setData(processed)
                graph.setLoading(false)

                setTimeout(() => {
                    graph.fgRef.current?.zoomToFit(400, 60)
                }, 500)
            })
            .catch(err => {
                console.error('Failed to load graph:', err)
                graph.setError('Impossible de charger le graphe')
                graph.setLoading(false)
            })
    }, [graph.forces.polygonRadius])

    // Configure forces when data changes
    useEffect(() => {
        if (!graph.data) return

        const timer = setTimeout(() => {
            configureForces(
                graph.fgRef.current,
                graph.forces,
                graph.data!.nodes,
                { x: 0, y: 0 },
                graph.isExpanded,
                graph.revealPhase
            )
        }, 100)

        return () => clearTimeout(timer)
    }, [graph.forces, graph.data, graph.isExpanded, graph.revealPhase])

    // Isolated nodes for the panel
    const isolatedNodes = useMemo(() => {
        return graph.data?.nodes.filter((n: any) => n.isIsolated) || []
    }, [graph.data])

    // Focus on a specific node
    const focusOnNode = useCallback((nodeId: string) => {
        const node = graph.data?.nodes.find(n => n.id === nodeId)
        if (node && graph.fgRef.current) {
            graph.fgRef.current.centerAt(node.x, node.y, 1000)
            graph.fgRef.current.zoom(2.5, 1000)
        }
    }, [graph.data])

    // Canvas rendering for nodes
    const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        // Visibility based on bloom phase
        const getNodeVisibility = () => {
            if (node.isHub) return true
            if (!graph.isExpanded) return false

            if (node.isPolygonVertex) {
                const idx = parseInt(node.id.replace('__polygon_vertex_', '').replace('__', ''))
                return graph.revealPhase >= 1000 + idx
            }

            if (node.clusterId !== undefined) {
                return graph.revealPhase >= 1000 + node.clusterId
            }

            if (node.isIsolated) {
                const idx = node.isolatedIndex ?? 0
                return graph.revealPhase >= 1 + idx
            }

            return graph.isExpanded
        }

        if (!getNodeVisibility()) return

        // Polygon vertex rendering
        if (node.isPolygonVertex) {
            const vertexRadius = 4
            const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, vertexRadius * 3)
            gradient.addColorStop(0, graph.nightMode ? 'rgba(211, 54, 130, 0.4)' : 'rgba(211, 54, 130, 0.3)')
            gradient.addColorStop(1, 'transparent')
            ctx.beginPath()
            ctx.arc(node.x, node.y, vertexRadius * 3, 0, 2 * Math.PI)
            ctx.fillStyle = gradient
            ctx.fill()

            ctx.beginPath()
            ctx.arc(node.x, node.y, vertexRadius, 0, 2 * Math.PI)
            ctx.fillStyle = '#d33682'
            ctx.fill()
            return
        }

        const isHovered = graph.hoverNode?.id === node.id
        const isHighlighted = graph.highlightNodes.has(node.id)
        const isHub = node.isHub
        const isIsolated = node.isIsolated
        const label = node.label || ''
        const weight = node.weight || 0

        // Hub rendering (sun)
        if (isHub) {
            const hubRadius = 25
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
                ctx.strokeStyle = graph.nightMode ? 'rgba(181, 137, 0, 0.6)' : 'rgba(203, 75, 22, 0.5)'
                ctx.lineWidth = 2
                ctx.stroke()
            }

            const gradient = ctx.createRadialGradient(node.x, node.y, hubRadius * 0.3, node.x, node.y, hubRadius * 2)
            gradient.addColorStop(0, graph.nightMode ? 'rgba(181, 137, 0, 0.4)' : 'rgba(203, 75, 22, 0.3)')
            gradient.addColorStop(0.5, graph.nightMode ? 'rgba(181, 137, 0, 0.15)' : 'rgba(203, 75, 22, 0.1)')
            gradient.addColorStop(1, 'transparent')
            ctx.beginPath()
            ctx.arc(node.x, node.y, hubRadius * 2, 0, 2 * Math.PI)
            ctx.fillStyle = gradient
            ctx.fill()

            ctx.beginPath()
            ctx.arc(node.x, node.y, hubRadius, 0, 2 * Math.PI)
            const sunGradient = ctx.createRadialGradient(node.x - 5, node.y - 5, 0, node.x, node.y, hubRadius)
            sunGradient.addColorStop(0, graph.nightMode ? '#b58900' : '#cb4b16')
            sunGradient.addColorStop(1, graph.nightMode ? '#856000' : '#a03810')
            ctx.fillStyle = sunGradient
            ctx.fill()

            const hubZoomFactor = Math.pow(globalScale, 0.4)
            const sunFontSize = Math.max(Math.min(18 / hubZoomFactor, 30), 10)
            ctx.font = `600 ${sunFontSize}px 'IBM Plex Serif', Georgia, serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#fdf6e3'
            ctx.fillText('☀', node.x, node.y)

            if (globalScale > 0.3) {
                const labelFontSize = Math.max(Math.min(11 / hubZoomFactor, 18), 7)
                ctx.font = `600 ${labelFontSize}px 'IBM Plex Serif', Georgia, serif`
                ctx.textBaseline = 'top'
                ctx.strokeStyle = graph.nightMode ? 'rgba(0,43,54,0.95)' : 'rgba(253,246,227,0.98)'
                ctx.lineWidth = Math.max(3 / hubZoomFactor, 1.5)
                ctx.strokeText('Athanor', node.x, node.y + hubRadius + 6)
                ctx.fillStyle = graph.nightMode ? '#b58900' : '#cb4b16'
                ctx.fillText('Athanor', node.x, node.y + hubRadius + 6)
            }
            return
        }

        // Regular node rendering
        const baseRadius = isIsolated ? 4 : (5 + Math.min(weight * 1.5, 12))
        const radius = baseRadius

        // Glow
        const glowRadius = radius + 6
        const glowColor = isIsolated
            ? (graph.nightMode ? 'rgba(108, 113, 196, 0.3)' : 'rgba(108, 113, 196, 0.2)')
            : (graph.nightMode ? 'rgba(42, 161, 152, 0.3)' : 'rgba(42, 161, 152, 0.2)')
        const gradient = ctx.createRadialGradient(node.x, node.y, radius * 0.5, node.x, node.y, glowRadius)
        gradient.addColorStop(0, glowColor)
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI)
        ctx.fillStyle = gradient
        ctx.fill()

        // Circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
        const nodeColor = isIsolated ? '#6c71c4' : colors.node
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

        // Highlight ring
        if (isHovered || isHighlighted) {
            ctx.beginPath()
            ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI)
            ctx.strokeStyle = isHovered ? '#fff' : hoverColor
            ctx.lineWidth = isHovered ? 2 : 1.5
            ctx.stroke()
        }

        // Labels
        if (!graph.showLabels) return

        const shouldShowLabel = isHovered ||
            isHighlighted ||
            globalScale > 2 ||
            (weight > 3 && globalScale > 1) ||
            (weight > 5 && globalScale > 0.5)

        if (shouldShowLabel && label) {
            const zoomFactor = Math.pow(globalScale, 0.5)
            const baseFontSize = isHovered ? 13 : (isHighlighted ? 11 : 10)
            const fontSize = Math.max(Math.min(baseFontSize / zoomFactor, 20), 6)

            ctx.font = `500 ${fontSize}px 'IBM Plex Serif', Georgia, serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'

            let displayLabel = label
            const maxLen = isHovered ? 80 : (globalScale > 1.5 ? 50 : (globalScale > 0.8 ? 30 : 20))
            if (label.length > maxLen) {
                displayLabel = label.substring(0, maxLen - 1) + '…'
            }

            const textY = node.y + radius + 4
            ctx.strokeStyle = graph.nightMode ? 'rgba(0,43,54,0.9)' : 'rgba(253,246,227,0.95)'
            ctx.lineWidth = Math.max(3 / zoomFactor, 1.5)
            ctx.strokeText(displayLabel, node.x, textY)
            ctx.fillStyle = isHovered ? colors.textHover : colors.text
            ctx.fillText(displayLabel, node.x, textY)
        }
    }, [graph.isExpanded, graph.revealPhase, graph.nightMode, graph.hoverNode, graph.highlightNodes, graph.showLabels, colors])

    // Link canvas object
    const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
        const sourceVisible = link.source && (link.source.isHub || graph.isExpanded)
        const targetVisible = link.target && (link.target.isHub || graph.isExpanded)
        if (!sourceVisible || !targetVisible) return

        // Hide links to hidden nodes
        if (link.source.isPolygonVertex || link.target.isPolygonVertex) {
            const sourceIdx = link.source.isPolygonVertex ? parseInt(link.source.id.replace('__polygon_vertex_', '').replace('__', '')) : -1
            const targetIdx = link.target.isPolygonVertex ? parseInt(link.target.id.replace('__polygon_vertex_', '').replace('__', '')) : -1
            if (sourceIdx >= 0 && graph.revealPhase < 1000 + sourceIdx) return
            if (targetIdx >= 0 && graph.revealPhase < 1000 + targetIdx) return
        }

        ctx.beginPath()
        ctx.moveTo(link.source.x, link.source.y)
        ctx.lineTo(link.target.x, link.target.y)

        if (link.type === 'POLYGON_EDGE') {
            ctx.strokeStyle = graph.nightMode ? 'rgba(211, 54, 130, 0.15)' : 'rgba(211, 54, 130, 0.1)'
            ctx.lineWidth = 1
            ctx.setLineDash([4, 4])
        } else if (link.type === 'HUB_LINK') {
            ctx.strokeStyle = graph.nightMode ? 'rgba(181, 137, 0, 0.2)' : 'rgba(203, 75, 22, 0.15)'
            ctx.lineWidth = 1
            ctx.setLineDash([])
        } else if (link.type === 'CLUSTER_ANCHOR') {
            ctx.strokeStyle = graph.nightMode ? 'rgba(211, 54, 130, 0.1)' : 'rgba(211, 54, 130, 0.08)'
            ctx.lineWidth = 0.5
            ctx.setLineDash([2, 2])
        } else {
            const isHighlighted = graph.highlightNodes.has(link.source.id) && graph.highlightNodes.has(link.target.id)
            ctx.strokeStyle = isHighlighted ? colors.linkHighlight : colors.link
            ctx.lineWidth = isHighlighted ? 2 : 1
            ctx.setLineDash([])
        }

        ctx.stroke()
        ctx.setLineDash([])
    }, [graph.isExpanded, graph.revealPhase, graph.nightMode, graph.highlightNodes, colors])

    // Loading state
    if (graph.loading) {
        return (
            <div className={`relative w-full h-screen flex items-center justify-center ${className}`}
                style={{ background: colors.bg }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.node }} />
            </div>
        )
    }

    // Error state
    if (graph.error) {
        return (
            <div className={`relative w-full h-screen flex items-center justify-center ${className}`}
                style={{ background: colors.bg, color: colors.text }}>
                {graph.error}
            </div>
        )
    }

    return (
        <div className={`relative w-full h-screen overflow-hidden ${className}`}
            style={{ background: colors.bg }}>
            {/* Force Graph */}
            <ForceGraph2D
                ref={graph.fgRef}
                graphData={graph.data as any}
                nodeCanvasObject={nodeCanvasObject}
                linkCanvasObject={linkCanvasObject}
                nodePointerAreaPaint={(node: any, color, ctx) => {
                    const radius = node.isHub ? 25 : (node.isIsolated ? 8 : 12)
                    ctx.beginPath()
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
                    ctx.fillStyle = color
                    ctx.fill()
                }}
                onNodeHover={graph.handleNodeHover}
                onNodeClick={graph.handleNodeClick}
                onNodeDragEnd={graph.handleNodeDragEnd}
                backgroundColor={colors.bg}
                width={graph.dimensions.width}
                height={graph.dimensions.height}
                enableNodeDrag={true}
                enableZoomInteraction={true}
                enablePanInteraction={true}
                cooldownTime={3000}
                warmupTicks={50}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
            />

            {/* Click hint */}
            {graph.showHint && !backgroundMode && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                    style={{ marginTop: '60px' }}>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md"
                        style={{
                            background: graph.nightMode ? 'rgba(0,43,54,0.8)' : 'rgba(253,246,227,0.9)',
                            color: colors.text,
                            border: `1px solid ${graph.nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        }}>
                        <Sparkles className="w-4 h-4" style={{ color: graph.nightMode ? '#b58900' : '#cb4b16' }} />
                        <span className="text-sm">Cliquez sur le soleil</span>
                    </div>
                </div>
            )}

            {/* Search Bar - Hidden in background mode */}
            {!backgroundMode && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                            style={{ color: colors.text }} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={graph.searchQuery}
                            onChange={(e) => graph.handleSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 w-64 rounded-xl text-sm transition-shadow focus:outline-none focus:ring-2"
                            style={{
                                background: graph.nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                color: colors.text,
                                border: 'none',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Zoom Controls - Hidden in background mode */}
            {!backgroundMode && (
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                    <button onClick={graph.zoomIn}
                        className="p-2.5 rounded-xl transition-all hover:scale-105"
                        style={{ background: graph.nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}>
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button onClick={graph.zoomOut}
                        className="p-2.5 rounded-xl transition-all hover:scale-105"
                        style={{ background: graph.nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}>
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button onClick={graph.resetView}
                        className="p-2.5 rounded-xl transition-all hover:scale-105"
                        style={{ background: graph.nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}>
                        <Maximize2 className="w-5 h-5" />
                    </button>
                    <button onClick={graph.unpinAllNodes}
                        className="p-2.5 rounded-xl transition-all hover:scale-105"
                        style={{ background: graph.nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}
                        title="Réinitialiser positions">
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Bottom Controls - Hidden in background mode */}
            {!backgroundMode && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 items-center">
                    <button
                        onClick={graph.toggleNightMode}
                        className="p-2.5 rounded-xl transition-all hover:scale-105"
                        style={{ background: graph.nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: colors.text }}>
                        {graph.nightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={graph.toggleSettings}
                        className="p-2.5 rounded-xl transition-all hover:scale-105"
                        style={{
                            background: graph.showSettings
                                ? (graph.nightMode ? 'rgba(42,161,152,0.3)' : 'rgba(42,161,152,0.2)')
                                : (graph.nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                            color: colors.text,
                        }}>
                        <Settings2 className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Stats - Hidden in background mode */}
            {!backgroundMode && (
                <div className="absolute bottom-4 left-4 text-xs px-3 py-2 rounded-xl flex items-center gap-3"
                    style={{
                        background: graph.nightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                        color: colors.text,
                        border: `1px solid ${graph.nightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    }}>
                    <span>{graph.data?.nodes.length} nœuds</span>
                    <span className="opacity-40">•</span>
                    <span>{(graph.data as any)?.links?.length || 0} liens</span>
                    {isolatedNodes.length > 0 && (
                        <>
                            <span className="opacity-40">•</span>
                            <span className="flex items-center gap-1" style={{ color: '#6c71c4' }}>
                                <span className="w-2 h-2 rounded-full" style={{ background: '#6c71c4' }} />
                                {isolatedNodes.length} isolés
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
