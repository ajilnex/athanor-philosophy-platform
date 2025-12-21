'use client'

import React, { useState, useMemo, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface TimelineSidebarProps {
  className?: string
  onYearSelect?: (year: string) => void
  onDateSelect?: (date: string) => void
  distribution?: Array<{ date: string; count: number }>
  hourlyDistribution?: Array<{ timestamp: string; count: number }>
  highlightedDate?: string | null
}

interface DayItem {
  date: string
  count: number
  year: string
  month: number
  day: number
  index: number
}

interface YearMarker {
  year: string
  startIndex: number
  position: number // 0-1 ratio
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONTAINER_HEIGHT = 700
const LENS_SIGMA = 4 // Width of the gaussian "bell" - tight and focused
const MAX_ZOOM = 25 // Maximum zoom factor - very accentuated effect

// ============================================================================
// GAUSSIAN FUNCTION - True lens effect
// ============================================================================

function gaussian(x: number, sigma: number): number {
  return Math.exp(-(x * x) / (2 * sigma * sigma))
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TimelineSidebar({
  className = '',
  onDateSelect,
  distribution = [],
  highlightedDate,
}: TimelineSidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouseY, setMouseY] = useState<number | null>(null)

  // -------------------------------------------------------------------------
  // DATA: Generate ALL days from start to end (including days with 0 messages)
  // -------------------------------------------------------------------------
  const items = useMemo(() => {
    if (!distribution || distribution.length === 0) return []

    // Create a map of date -> count for quick lookup
    const countMap = new Map<string, number>()
    distribution.forEach(d => {
      const dateKey = d.date.split('T')[0]
      countMap.set(dateKey, (countMap.get(dateKey) || 0) + d.count)
    })

    // Find date range (use UTC to avoid DST issues)
    const dates = distribution.map(d => new Date(d.date).getTime())
    const startTime = Math.min(...dates)
    const endTime = Math.max(...dates)

    // Generate all days in the range using UTC milliseconds
    const allDays: DayItem[] = []
    const seenDates = new Set<string>()
    const ONE_DAY_MS = 24 * 60 * 60 * 1000

    let currentTime = startTime
    let index = 0

    while (currentTime <= endTime) {
      const currentDate = new Date(currentTime)
      // Use UTC methods to avoid timezone shifts
      const year = currentDate.getUTCFullYear()
      const month = currentDate.getUTCMonth()
      const day = currentDate.getUTCDate()
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      // Skip if we've already added this date (DST edge case)
      if (!seenDates.has(dateStr)) {
        seenDates.add(dateStr)
        const count = countMap.get(dateStr) || 0

        allDays.push({
          date: dateStr,
          count,
          year: year.toString(),
          month,
          day,
          index: index++,
        })
      }

      // Move to next day
      currentTime += ONE_DAY_MS
    }

    return allDays
  }, [distribution])

  // -------------------------------------------------------------------------
  // YEAR MARKERS: Fixed positions for year labels
  // -------------------------------------------------------------------------
  const yearMarkers = useMemo(() => {
    if (items.length === 0) return []
    const markers: YearMarker[] = []
    let currentYear = ''

    items.forEach((item, i) => {
      if (item.year !== currentYear) {
        currentYear = item.year
        markers.push({
          year: item.year,
          startIndex: i,
          position: i / items.length,
        })
      }
    })
    return markers
  }, [items])

  // -------------------------------------------------------------------------
  // MAX COUNT: For intensity calculation
  // -------------------------------------------------------------------------
  const maxCount = useMemo(() => {
    if (items.length === 0) return 1
    return Math.max(...items.map(d => d.count))
  }, [items])

  // -------------------------------------------------------------------------
  // LAYOUT: Calculate bar positions with TRUE GAUSSIAN LENS effect
  // -------------------------------------------------------------------------
  const layout = useMemo(() => {
    if (items.length === 0) return []

    const n = items.length
    const baseHeight = CONTAINER_HEIGHT / n

    // If no hover, uniform distribution
    if (mouseY === null) {
      let y = 0
      return items.map((item, i) => {
        const pos = { y, height: baseHeight, item, zoom: 1 }
        y += baseHeight
        return pos
      })
    }

    // Find the center index based on mouse position
    const hoverRatio = Math.max(0, Math.min(1, mouseY / CONTAINER_HEIGHT))
    const centerIndex = hoverRatio * (n - 1)

    // Step 1: Calculate raw zoom factors using gaussian
    const zoomFactors = new Array(n)
    for (let i = 0; i < n; i++) {
      const distance = Math.abs(i - centerIndex)
      // Gaussian: max zoom at center, decays smoothly to 1
      const g = gaussian(distance, LENS_SIGMA)
      zoomFactors[i] = 1 + (MAX_ZOOM - 1) * g
    }

    // Step 2: Calculate total height with zoom factors
    let totalHeight = 0
    for (let i = 0; i < n; i++) {
      totalHeight += baseHeight * zoomFactors[i]
    }

    // Step 3: Normalize to fit in CONTAINER_HEIGHT
    const scaleFactor = CONTAINER_HEIGHT / totalHeight

    // Step 4: Apply final heights and compute positions
    const positions = []
    let y = 0
    for (let i = 0; i < n; i++) {
      const height = baseHeight * zoomFactors[i] * scaleFactor
      positions.push({ y, height, item: items[i], zoom: zoomFactors[i] })
      y += height
    }

    return positions
  }, [items, mouseY])

  // -------------------------------------------------------------------------
  // HOVERED ITEM: For tooltip display
  // -------------------------------------------------------------------------
  const hoveredItem = useMemo(() => {
    if (mouseY === null || layout.length === 0) return null
    return layout.find(p => mouseY >= p.y && mouseY < p.y + p.height) || null
  }, [layout, mouseY])

  // -------------------------------------------------------------------------
  // HIGHLIGHTED POSITION: For message hover indicator
  // -------------------------------------------------------------------------
  const highlightedPosition = useMemo(() => {
    if (!highlightedDate || items.length === 0) return null

    const highlightTime = new Date(highlightedDate).getTime()

    // Find closest day
    let closestIndex = 0
    let minDiff = Infinity
    for (let i = 0; i < items.length; i++) {
      const itemTime = new Date(items[i].date).getTime()
      const diff = Math.abs(itemTime - highlightTime)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }

    // Linear position (no fisheye when just highlighting)
    const ratio = closestIndex / (items.length - 1 || 1)
    const y = ratio * CONTAINER_HEIGHT

    // Format date and time
    const date = new Date(highlightedDate)
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const formattedTime = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    return { y, formattedDate, formattedTime }
  }, [highlightedDate, items])

  // -------------------------------------------------------------------------
  // EVENT HANDLERS
  // -------------------------------------------------------------------------
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMouseY(e.clientY - rect.top)
  }

  const handleMouseLeave = () => setMouseY(null)

  const handleClick = () => {
    if (hoveredItem) {
      const dateOnly = hoveredItem.item.date.split('T')[0]
      onDateSelect?.(dateOnly)
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className={`w-44 border-r border-[var(--border-subtle)] bg-[var(--abyss)] flex flex-col items-center py-3 ${className}`}>
      <div className="relative w-full flex-1">

        {/* Year markers - Fixed positions on the left */}
        <div
          className="absolute left-0 top-0 w-10 pointer-events-none select-none"
          style={{ height: CONTAINER_HEIGHT }}
        >
          {yearMarkers.map((marker, i) => {
            const nextMarker = yearMarkers[i + 1]
            const startY = marker.position * CONTAINER_HEIGHT
            const endY = nextMarker ? nextMarker.position * CONTAINER_HEIGHT : CONTAINER_HEIGHT
            const height = endY - startY

            return (
              <div
                key={marker.year}
                className="absolute left-0 flex items-start"
                style={{ top: startY, height }}
              >
                <span className="text-[10px] font-mono font-bold text-[var(--accent)] pl-1 leading-none">
                  {marker.year}
                </span>
                <div
                  className="absolute left-0 w-px bg-[var(--accent)]/30"
                  style={{ top: 12, height: Math.max(0, height - 14) }}
                />
              </div>
            )
          })}
        </div>

        {/* Waveform container */}
        <div
          ref={containerRef}
          className="absolute left-10 right-0 cursor-crosshair"
          style={{ height: CONTAINER_HEIGHT }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* Baseline */}
          <div className="absolute top-0 bottom-0 left-0 w-px bg-[var(--border-default)]" />

          {/* SVG Smooth Wave */}
          <svg
            className="w-full h-full overflow-visible pointer-events-none"
            viewBox={`0 0 100 ${CONTAINER_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(42, 161, 152, 0.3)" />
                <stop offset="50%" stopColor="rgba(42, 161, 152, 0.6)" />
                <stop offset="100%" stopColor="rgba(42, 161, 152, 0.3)" />
              </linearGradient>
              <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Individual curved segments per day - visually smooth but logically separate */}
            {layout.map((p: any, idx: number) => {
              const { item, y, height, zoom } = p
              const intensity = Math.min(item.count / (maxCount * 0.4), 1)
              const barWidth = Math.max(intensity * 80 + 10, 10)

              // Opacity based on intensity only
              const finalOpacity = 0.08 + 0.87 * Math.pow(intensity, 0.7)

              // Always show segments, but skip truly invisible ones
              if (height < 0.1) return null

              const isHovered = hoveredItem?.item.date === item.date
              if (isHovered) return null // Drawn separately

              // Get neighbor widths for smooth curve effect
              const prevItem = layout[idx - 1] as any
              const nextItem = layout[idx + 1] as any
              const prevWidth = prevItem ? Math.max(Math.min(prevItem.item.count / (maxCount * 0.4), 1) * 80 + 10, 10) : barWidth
              const nextWidth = nextItem ? Math.max(Math.min(nextItem.item.count / (maxCount * 0.4), 1) * 80 + 10, 10) : barWidth

              // Minimal gap between days for separation (scales with height)
              const gap = Math.min(0.3, height * 0.1)
              const segmentTop = y + gap
              const segmentBottom = y + height - gap
              const segmentHeight = segmentBottom - segmentTop

              if (segmentHeight < 0.1) return null

              // Create curved segment path
              // Top edge curves from previous width, bottom edge curves to next width
              const topWidth = (barWidth + prevWidth) / 2
              const bottomWidth = (barWidth + nextWidth) / 2

              const path = `
                M 0 ${segmentTop}
                L ${topWidth} ${segmentTop}
                Q ${barWidth + 3} ${y + height / 2}, ${bottomWidth} ${segmentBottom}
                L 0 ${segmentBottom}
                Z
              `

              return (
                <path
                  key={item.date}
                  d={path}
                  fill={`rgba(42, 161, 152, ${finalOpacity})`}
                  style={{ transition: 'all 0.12s ease-out' }}
                />
              )
            })}

            {/* Stylized arrow indicator for hovered item */}
            {hoveredItem && (() => {
              const p = layout.find((l: any) => l.item.date === hoveredItem.item.date) as any
              if (!p) return null

              const centerY = p.y + p.height / 2
              const intensity = Math.min(p.item.count / (maxCount * 0.4), 1)
              const barWidth = Math.max(intensity * 80 + 10, 10)

              return (
                <g style={{ transition: 'all 0.1s ease-out' }}>
                  {/* Thin horizontal line */}
                  <line
                    x1="0"
                    y1={centerY}
                    x2={barWidth + 15}
                    y2={centerY}
                    stroke="var(--warm)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Arrow head pointing right */}
                  <polygon
                    points={`${barWidth + 8},${centerY - 5} ${barWidth + 18},${centerY} ${barWidth + 8},${centerY + 5}`}
                    fill="var(--warm)"
                  />
                  {/* Small dot at origin */}
                  <circle
                    cx="3"
                    cy={centerY}
                    r="3"
                    fill="var(--warm)"
                  />
                </g>
              )
            })()}
          </svg>

          {/* Highlighted message indicator */}
          {highlightedPosition && mouseY === null && (
            <div
              className="absolute left-0 right-0 pointer-events-none z-40 transition-all duration-150"
              style={{ top: highlightedPosition.y }}
            >
              {/* Date/time badge */}
              <div
                className="absolute right-0 px-1.5 py-0.5 bg-[var(--warm)] rounded-sm text-[9px] font-mono text-[var(--void)] whitespace-nowrap shadow-sm"
                style={{ top: -16 }}
              >
                {highlightedPosition.formattedDate} · {highlightedPosition.formattedTime}
              </div>
              {/* Horizontal line */}
              <div className="absolute left-0 right-0 h-[2px] bg-[var(--warm)]" />
              {/* Triangle indicator */}
              <div
                className="absolute left-0 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[var(--warm)]"
                style={{ top: -4 }}
              />
            </div>
          )}

          {/* Tooltip on hover */}
          {hoveredItem && mouseY !== null && (
            <div
              className="absolute left-full ml-3 z-50 px-3 py-1.5 bg-[var(--card)] border border-[var(--border-accent)] rounded-lg text-xs font-mono text-[var(--text-bright)] whitespace-nowrap pointer-events-none shadow-lg"
              style={{ top: mouseY - 12 }}
            >
              <span className="text-[var(--text-primary)]">
                {new Date(hoveredItem.item.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="mx-2 text-[var(--text-ghost)]">·</span>
              <span className="text-[var(--warm)] font-bold">{hoveredItem.item.count}</span>
              <span className="text-[var(--text-tertiary)] ml-1">msgs</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
