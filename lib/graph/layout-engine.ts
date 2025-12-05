/**
 * Graph Layout Engine
 * d3-force based layout with simple API
 */

import {
    forceSimulation,
    forceLink,
    forceManyBody,
    forceCenter,
    forceCollide,
    Simulation,
    SimulationNodeDatum,
    SimulationLinkDatum,
} from 'd3-force'
import { GraphNode, GraphEdge } from './types'

export interface LayoutConfig {
    width: number
    height: number
    /** Repulsion strength (negative = repel) */
    chargeStrength: number
    /** Link distance */
    linkDistance: number
    /** Collision radius multiplier */
    collisionMultiplier: number
    /** Number of simulation ticks to run */
    iterations: number
}

const DEFAULT_LAYOUT: LayoutConfig = {
    width: 800,
    height: 600,
    chargeStrength: -150,
    linkDistance: 60,
    collisionMultiplier: 2,
    iterations: 300,
}

type D3Node = GraphNode & SimulationNodeDatum
type D3Link = SimulationLinkDatum<D3Node> & { type: string }

/**
 * Create and run a force simulation
 * Returns positioned nodes
 */
export function layoutGraph(
    nodes: GraphNode[],
    edges: GraphEdge[],
    config: Partial<LayoutConfig> = {}
): GraphNode[] {
    const cfg = { ...DEFAULT_LAYOUT, ...config }

    // Clone nodes to avoid mutating originals
    const simNodes: D3Node[] = nodes.map(n => ({ ...n }))

    // Create link references
    const simLinks: D3Link[] = edges.map(e => ({
        source: typeof e.source === 'string' ? e.source : e.source.id,
        target: typeof e.target === 'string' ? e.target : e.target.id,
        type: e.type,
    }))

    // Build simulation
    const simulation: Simulation<D3Node, D3Link> = forceSimulation(simNodes)
        .force('link', forceLink<D3Node, D3Link>(simLinks)
            .id(d => d.id)
            .distance(cfg.linkDistance)
        )
        .force('charge', forceManyBody<D3Node>()
            .strength(d => cfg.chargeStrength * (1 + d.weight * 0.1))
        )
        .force('center', forceCenter(cfg.width / 2, cfg.height / 2))
        .force('collision', forceCollide<D3Node>()
            .radius(d => (d.weight + 1) * cfg.collisionMultiplier)
        )
        .stop()

    // Run simulation
    for (let i = 0; i < cfg.iterations; i++) {
        simulation.tick()
    }

    return simNodes
}

/**
 * Create a live simulation that can be updated
 */
export function createLiveSimulation(
    nodes: GraphNode[],
    edges: GraphEdge[],
    config: Partial<LayoutConfig> = {},
    onTick: (nodes: GraphNode[]) => void
): {
    simulation: Simulation<D3Node, D3Link>
    stop: () => void
    restart: () => void
    reheat: () => void
} {
    const cfg = { ...DEFAULT_LAYOUT, ...config }

    const simNodes: D3Node[] = nodes.map(n => ({ ...n }))
    const simLinks: D3Link[] = edges.map(e => ({
        source: typeof e.source === 'string' ? e.source : e.source.id,
        target: typeof e.target === 'string' ? e.target : e.target.id,
        type: e.type,
    }))

    const simulation = forceSimulation(simNodes)
        .force('link', forceLink<D3Node, D3Link>(simLinks)
            .id(d => d.id)
            .distance(cfg.linkDistance)
        )
        .force('charge', forceManyBody<D3Node>()
            .strength(d => cfg.chargeStrength * (1 + d.weight * 0.1))
        )
        .force('center', forceCenter(cfg.width / 2, cfg.height / 2))
        .force('collision', forceCollide<D3Node>()
            .radius(d => (d.weight + 1) * cfg.collisionMultiplier)
        )
        .on('tick', () => onTick(simNodes))

    return {
        simulation,
        stop: () => simulation.stop(),
        restart: () => simulation.restart(),
        reheat: () => simulation.alpha(0.3).restart(),
    }
}
