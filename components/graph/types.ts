'use client'

/**
 * Shared types and constants for force graph components
 * Extracted from ForceGraphCanvas and ArchiveGraph to eliminate duplication
 */

// Solarized color palette
export const GRAPH_COLORS = {
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

// Force simulation settings
export interface ForceSettings {
    chargeStrength: number
    linkDistance: number
    centerForce: number
    collisionRadius: number
    polygonRadius: number
}

export const DEFAULT_FORCES: ForceSettings = {
    chargeStrength: -120,
    linkDistance: 50,
    centerForce: 0.08,
    collisionRadius: 15,
    polygonRadius: 280,
}

// Graph node type
export interface GraphNode {
    id: string
    label: string
    type?: 'BILLET' | 'AUTHOR' | 'TAG' | 'HUB' | 'POLYGON_VERTEX'
    slug?: string
    url?: string
    weight: number
    degree?: number
    x?: number
    y?: number
    fx?: number | null
    fy?: number | null
    val?: number
    // Internal flags
    isHub?: boolean
    isPolygonVertex?: boolean
    isIsolated?: boolean
    isolatedIndex?: number
    clusterId?: number
}

// Graph edge type
export interface GraphEdge {
    source: string | GraphNode
    target: string | GraphNode
    type: string
}

// Graph data container
export interface GraphData {
    nodes: GraphNode[]
    links: GraphEdge[]
}

// Props for the base renderer
export interface ForceGraphRendererProps {
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
    dimensions: { width: number; height: number }
    hubId: string
    hubLabel: string
    hubPosition?: { x: number; y: number }
    backgroundMode?: boolean
    className?: string
    // Callbacks
    onNodeHover: (node: GraphNode | null) => void
    onNodeClick: (node: GraphNode) => void
    onNodeDragEnd: (node: GraphNode) => void
    onZoomIn: () => void
    onZoomOut: () => void
    onResetView: () => void
    onToggleNightMode: () => void
    onToggleSettings: () => void
    onToggleLabels: () => void
    onSearch: (query: string) => void
    onForceChange: (key: keyof ForceSettings, value: number) => void
    onClose?: () => void
    fgRef: React.RefObject<any>
}
