/**
 * Knowledge Graph Types
 * Clean, minimal data model for the graph visualization
 */

export interface GraphNode {
    id: string
    label: string
    type: 'BILLET' | 'TAG' | 'AUTHOR'
    slug?: string
    /** Computed by layout engine */
    x?: number
    y?: number
    vx?: number
    vy?: number
    /** Visual weight based on connections */
    weight: number
}

export interface GraphEdge {
    source: string | GraphNode
    target: string | GraphNode
    type: 'BACKLINK' | 'TAG' | 'AUTHOR'
}

export interface GraphData {
    nodes: GraphNode[]
    edges: GraphEdge[]
}

export interface GraphViewState {
    /** Current zoom level (1 = 100%) */
    zoom: number
    /** Pan offset X */
    panX: number
    /** Pan offset Y */
    panY: number
    /** Currently hovered node ID */
    hoveredId: string | null
    /** IDs of nodes connected to hovered node */
    highlightedIds: Set<string>
}

export interface GraphConfig {
    /** Show node labels when zoom > this value */
    labelZoomThreshold: number
    /** Node base radius in pixels */
    nodeRadius: number
    /** Link opacity (0-1) */
    linkOpacity: number
    /** Enable night mode */
    nightMode: boolean
    /** Minimum degree for labels to be always visible */
    minDegreeForLabel: number
}

export const DEFAULT_CONFIG: GraphConfig = {
    labelZoomThreshold: 0.8,
    nodeRadius: 10,
    linkOpacity: 0.25,
    nightMode: false,
    minDegreeForLabel: 2,
}
