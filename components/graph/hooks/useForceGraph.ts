'use client'

/**
 * useForceGraph - Shared hook for force graph components
 * Extracts common logic from ForceGraphCanvas and ArchiveGraph
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import {
    GraphNode,
    GraphEdge,
    GraphData,
    ForceSettings,
    DEFAULT_FORCES,
} from '../types'

export interface UseForceGraphOptions {
    hubId?: string
    hubLabel?: string
    hubPosition?: { x: number; y: number }
    initialExpanded?: boolean
    onNodeClick?: (node: GraphNode) => void
}

export interface UseForceGraphReturn {
    // State
    data: GraphData | null
    loading: boolean
    error: string | null
    nightMode: boolean
    showLabels: boolean
    showSettings: boolean
    forces: ForceSettings
    hoverNode: GraphNode | null
    highlightNodes: Set<string>
    isExpanded: boolean
    revealPhase: number
    showHint: boolean
    isSimulationRunning: boolean
    searchQuery: string
    dimensions: { width: number; height: number }
    // Ref
    fgRef: React.RefObject<any>
    // Setters
    setData: (data: GraphData | null) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    // Actions
    handleNodeHover: (node: any) => void
    handleNodeClick: (node: any) => void
    handleNodeDragEnd: (node: any) => void
    handleSearch: (query: string) => void
    triggerBloom: () => void
    triggerCollapse: () => void
    zoomIn: () => void
    zoomOut: () => void
    resetView: () => void
    toggleNightMode: () => void
    toggleSettings: () => void
    toggleLabels: () => void
    toggleSimulation: () => void
    unpinAllNodes: () => void
    updateForce: (key: keyof ForceSettings, value: number) => void
}

export function useForceGraph(options: UseForceGraphOptions = {}): UseForceGraphReturn {
    const {
        hubId = '__athanor_hub__',
        hubLabel = 'Athanor',
        hubPosition = { x: 0, y: 0 },
        initialExpanded = false,
        onNodeClick: customNodeClick,
    } = options

    const fgRef = useRef<any>(null)

    // Core state
    const [data, setData] = useState<GraphData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // UI state
    const [nightMode, setNightMode] = useState(false)
    const [showLabels, setShowLabels] = useState(true)
    const [showSettings, setShowSettings] = useState(false)
    const [forces, setForces] = useState<ForceSettings>(DEFAULT_FORCES)
    const [searchQuery, setSearchQuery] = useState('')

    // Interaction state
    const [hoverNode, setHoverNode] = useState<GraphNode | null>(null)
    const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set())
    const [isSimulationRunning, setIsSimulationRunning] = useState(true)

    // Bloom animation state
    const [isExpanded, setIsExpanded] = useState(initialExpanded)
    const [revealPhase, setRevealPhase] = useState(initialExpanded ? 9999 : 0)
    const [showHint, setShowHint] = useState(!initialExpanded)

    // Dimensions
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

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

    // Handle node hover
    const handleNodeHover = useCallback(
        (node: any) => {
            setHoverNode(node as GraphNode | null)

            if (node && data) {
                const neighbors = new Set<string>()
                neighbors.add(node.id)

                data.links?.forEach((link: any) => {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target

                    if (sourceId === node.id) neighbors.add(targetId)
                    if (targetId === node.id) neighbors.add(sourceId)
                })

                setHighlightNodes(neighbors)
            } else {
                setHighlightNodes(new Set())
            }
        },
        [data]
    )

    // Trigger bloom animation
    const triggerBloom = useCallback(() => {
        if (!data) return

        const nodes = data.nodes || []
        const numClusters = nodes.filter((n: any) => n.isPolygonVertex).length
        const isolatedNodesList = nodes.filter((n: any) => n.isIsolated)
        const numIsolated = isolatedNodesList.length

        // Mark each isolated node with its index
        isolatedNodesList.forEach((node: any, idx: number) => {
            node.isolatedIndex = idx
        })

        setIsExpanded(true)
        setRevealPhase(0)

        // Phase 1 to N: Reveal isolated nodes
        for (let i = 0; i < numIsolated; i++) {
            setTimeout(() => {
                setRevealPhase(1 + i)
                if (i === 0) fgRef.current?.d3ReheatSimulation()
            }, 100 + i * 80)
        }

        // After isolated nodes, reveal clusters
        const isolatedDuration = 100 + numIsolated * 80 + 150
        for (let i = 0; i < numClusters; i++) {
            setTimeout(() => {
                setRevealPhase(1000 + i)
            }, isolatedDuration + i * 120)
        }
    }, [data])

    // Trigger collapse animation
    const triggerCollapse = useCallback(() => {
        if (!data) return

        const numClusters = data.nodes.filter((n) => n.type === 'BILLET').length > 0
            ? Math.ceil(Math.sqrt(data.nodes.filter((n) => n.type === 'BILLET').length))
            : 3
        const isolatedCount = data.nodes.filter((n: any) => n.isIsolated).length

        fgRef.current?.d3ReheatSimulation()

        // Hide clusters one by one (reverse order)
        for (let i = numClusters - 1; i >= 0; i--) {
            setTimeout(() => {
                setRevealPhase(1000 + i)
            }, (numClusters - 1 - i) * 150)
        }

        // Then hide isolated nodes
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

    // Handle node click
    const handleNodeClick = useCallback(
        (node: any) => {
            // Click on hub toggles bloom
            if (node.isHub) {
                setShowHint(false)
                if (isExpanded) {
                    triggerCollapse()
                } else {
                    triggerBloom()
                }
                return
            }

            // Regular node click
            if (customNodeClick) {
                customNodeClick(node as GraphNode)
            }
        },
        [isExpanded, triggerBloom, triggerCollapse, customNodeClick]
    )

    // Handle node drag end
    const handleNodeDragEnd = useCallback((node: any) => {
        node.fx = undefined
        node.fy = undefined
        fgRef.current?.d3ReheatSimulation()
    }, [])

    // Handle search
    const handleSearch = useCallback(
        (query: string) => {
            setSearchQuery(query)
            if (!query || !data) return

            const match = data.nodes.find((n) =>
                n.label.toLowerCase().includes(query.toLowerCase())
            )

            if (match && fgRef.current) {
                fgRef.current.centerAt(match.x, match.y, 1000)
                fgRef.current.zoom(3, 1000)
                setHoverNode(match)
            }
        },
        [data]
    )

    // Zoom controls
    const zoomIn = useCallback(() => {
        fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 300)
    }, [])

    const zoomOut = useCallback(() => {
        fgRef.current?.zoom(fgRef.current.zoom() / 1.5, 300)
    }, [])

    const resetView = useCallback(() => {
        fgRef.current?.zoomToFit(400, 60)
    }, [])

    // Toggle controls
    const toggleNightMode = useCallback(() => setNightMode((prev) => !prev), [])
    const toggleSettings = useCallback(() => setShowSettings((prev) => !prev), [])
    const toggleLabels = useCallback(() => setShowLabels((prev) => !prev), [])

    const toggleSimulation = useCallback(() => {
        if (isSimulationRunning) {
            fgRef.current?.pauseAnimation()
        } else {
            fgRef.current?.resumeAnimation()
        }
        setIsSimulationRunning((prev) => !prev)
    }, [isSimulationRunning])

    // Unpin all nodes
    const unpinAllNodes = useCallback(() => {
        if (!data) return
        data.nodes?.forEach((node: any) => {
            node.fx = null
            node.fy = null
        })
        fgRef.current?.d3ReheatSimulation()
    }, [data])

    // Update force setting
    const updateForce = useCallback((key: keyof ForceSettings, value: number) => {
        setForces((prev) => ({ ...prev, [key]: value }))
    }, [])

    return {
        // State
        data,
        loading,
        error,
        nightMode,
        showLabels,
        showSettings,
        forces,
        hoverNode,
        highlightNodes,
        isExpanded,
        revealPhase,
        showHint,
        isSimulationRunning,
        searchQuery,
        dimensions,
        // Ref
        fgRef,
        // Setters
        setData,
        setLoading,
        setError,
        // Actions
        handleNodeHover,
        handleNodeClick,
        handleNodeDragEnd,
        handleSearch,
        triggerBloom,
        triggerCollapse,
        zoomIn,
        zoomOut,
        resetView,
        toggleNightMode,
        toggleSettings,
        toggleLabels,
        toggleSimulation,
        unpinAllNodes,
        updateForce,
    }
}
