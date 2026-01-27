/**
 * Platonic Constellation Icons
 * Mini-graph SVG icons inspired by 2D projections of Platonic solids
 * Used as abstract, meaningless reactions on the Wall
 */

interface PlatonicIconProps {
    className?: string
    filled?: boolean
}

// Tetrahedron - 4 vertices, 6 edges (triangle with center)
export function Tetrahedron({ className = '', filled = false }: PlatonicIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            {/* Triangle outline */}
            <polygon points="12,3 3,20 21,20" fill={filled ? 'currentColor' : 'none'} />
            {/* Edges to center */}
            <line x1="12" y1="3" x2="12" y2="14" />
            <line x1="3" y1="20" x2="12" y2="14" />
            <line x1="21" y1="20" x2="12" y2="14" />
            {/* Center node */}
            <circle cx="12" cy="14" r="2" fill="currentColor" />
            {/* Vertex nodes */}
            <circle cx="12" cy="3" r="1.5" fill="currentColor" />
            <circle cx="3" cy="20" r="1.5" fill="currentColor" />
            <circle cx="21" cy="20" r="1.5" fill="currentColor" />
        </svg>
    )
}

// Cube (Hexahedron) - 8 vertices, 12 edges (square in square)
export function Hexahedron({ className = '', filled = false }: PlatonicIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            {/* Outer square */}
            <rect x="2" y="2" width="20" height="20" fill={filled ? 'currentColor' : 'none'} />
            {/* Inner square */}
            <rect x="7" y="7" width="10" height="10" fill="none" />
            {/* Connecting edges */}
            <line x1="2" y1="2" x2="7" y2="7" />
            <line x1="22" y1="2" x2="17" y2="7" />
            <line x1="2" y1="22" x2="7" y2="17" />
            <line x1="22" y1="22" x2="17" y2="17" />
            {/* Corner nodes */}
            <circle cx="2" cy="2" r="1.5" fill="currentColor" />
            <circle cx="22" cy="2" r="1.5" fill="currentColor" />
            <circle cx="2" cy="22" r="1.5" fill="currentColor" />
            <circle cx="22" cy="22" r="1.5" fill="currentColor" />
            <circle cx="7" cy="7" r="1.5" fill="currentColor" />
            <circle cx="17" cy="7" r="1.5" fill="currentColor" />
            <circle cx="7" cy="17" r="1.5" fill="currentColor" />
            <circle cx="17" cy="17" r="1.5" fill="currentColor" />
        </svg>
    )
}

// Octahedron - 6 vertices, 12 edges (diamond with horizontals)
export function Octahedron({ className = '', filled = false }: PlatonicIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
            {/* Diamond shape */}
            <polygon points="12,2 22,12 12,22 2,12" fill={filled ? 'currentColor' : 'none'} />
            {/* Horizontal edge through center */}
            <line x1="2" y1="12" x2="22" y2="12" />
            {/* Diagonal edges to center */}
            <line x1="12" y1="2" x2="12" y2="12" />
            <line x1="12" y1="22" x2="12" y2="12" />
            {/* Vertex nodes */}
            <circle cx="12" cy="2" r="1.5" fill="currentColor" />
            <circle cx="22" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="22" r="1.5" fill="currentColor" />
            <circle cx="2" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
    )
}

// Dodecahedron - 20 vertices, 30 edges (pentagon in pentagon)
export function Dodecahedron({ className = '', filled = false }: PlatonicIconProps) {
    // Pentagon vertices (outer)
    const outerR = 10
    const innerR = 5
    const cx = 12, cy = 12
    const angle = -Math.PI / 2

    const outerPoints = Array.from({ length: 5 }, (_, i) => {
        const a = angle + (i * 2 * Math.PI) / 5
        return `${cx + outerR * Math.cos(a)},${cy + outerR * Math.sin(a)}`
    }).join(' ')

    const innerPoints = Array.from({ length: 5 }, (_, i) => {
        const a = angle + Math.PI / 5 + (i * 2 * Math.PI) / 5
        return `${cx + innerR * Math.cos(a)},${cy + innerR * Math.sin(a)}`
    }).join(' ')

    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Outer pentagon */}
            <polygon points={outerPoints} fill={filled ? 'currentColor' : 'none'} />
            {/* Inner pentagon (rotated) */}
            <polygon points={innerPoints} fill="none" />
            {/* Connecting edges */}
            {Array.from({ length: 5 }, (_, i) => {
                const outerA = angle + (i * 2 * Math.PI) / 5
                const innerA = angle + Math.PI / 5 + (i * 2 * Math.PI) / 5
                const ox = cx + outerR * Math.cos(outerA)
                const oy = cy + outerR * Math.sin(outerA)
                const ix = cx + innerR * Math.cos(innerA)
                const iy = cy + innerR * Math.sin(innerA)
                return <line key={i} x1={ox} y1={oy} x2={ix} y2={iy} />
            })}
            {/* Vertex nodes */}
            {Array.from({ length: 5 }, (_, i) => {
                const a = angle + (i * 2 * Math.PI) / 5
                return <circle key={`o${i}`} cx={cx + outerR * Math.cos(a)} cy={cy + outerR * Math.sin(a)} r="1.5" fill="currentColor" />
            })}
            {Array.from({ length: 5 }, (_, i) => {
                const a = angle + Math.PI / 5 + (i * 2 * Math.PI) / 5
                return <circle key={`i${i}`} cx={cx + innerR * Math.cos(a)} cy={cy + innerR * Math.sin(a)} r="1.5" fill="currentColor" />
            })}
        </svg>
    )
}

// Icosahedron - 12 vertices, 30 edges (triangular mesh)
export function Icosahedron({ className = '', filled = false }: PlatonicIconProps) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
            {/* Outer hexagon-ish shape */}
            <polygon points="12,2 20,6 20,18 12,22 4,18 4,6" fill={filled ? 'currentColor' : 'none'} />
            {/* Inner star pattern */}
            <line x1="12" y1="2" x2="12" y2="22" />
            <line x1="4" y1="6" x2="20" y2="18" />
            <line x1="20" y1="6" x2="4" y2="18" />
            {/* Cross connections */}
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <line x1="12" y1="2" x2="4" y2="18" />
            <line x1="12" y1="2" x2="20" y2="18" />
            <line x1="12" y1="22" x2="4" y2="6" />
            <line x1="12" y1="22" x2="20" y2="6" />
            {/* Vertex nodes */}
            <circle cx="12" cy="2" r="1.5" fill="currentColor" />
            <circle cx="20" cy="6" r="1.5" fill="currentColor" />
            <circle cx="20" cy="18" r="1.5" fill="currentColor" />
            <circle cx="12" cy="22" r="1.5" fill="currentColor" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
    )
}

// Reaction type definitions with well-separated colors
export const PLATONIC_REACTIONS = [
    { type: 'tetra', Icon: Tetrahedron, color: 'var(--sol-magenta)', label: 'Tétraèdre' },
    { type: 'hexa', Icon: Hexahedron, color: 'var(--sol-blue)', label: 'Hexaèdre' },
    { type: 'octa', Icon: Octahedron, color: 'var(--sol-green)', label: 'Octaèdre' },
    { type: 'dodeca', Icon: Dodecahedron, color: 'var(--sol-orange)', label: 'Dodécaèdre' },
    { type: 'icosa', Icon: Icosahedron, color: 'var(--sol-cyan)', label: 'Icosaèdre' },
] as const

export type PlatonicReactionType = typeof PLATONIC_REACTIONS[number]['type']
