
'use client'

import React, { useState, useMemo, useRef } from 'react'

interface TimelineSidebarProps {
  startDate?: string
  endDate?: string
  currentDate?: string
  className?: string
  onYearSelect?: (year: string) => void
  onDateSelect?: (date: string) => void
  distribution?: Array<{ date: string; count: number }>
  hourlyDistribution?: Array<{
    timestamp: string
    count: number
    first_msg?: string
    last_msg?: string
  }>
  highlightedDate?: string | null // Date du message survolé
}

interface TimeItem {
  timestamp: string // Could be date or hour timestamp
  count: number
  year: string
  month: number
  day: number
  hour?: number
  index: number
  firstMsg?: string
  lastMsg?: string
}

interface YearMarker {
  year: string
  startIndex: number
  linearY: number // Position in un-distorted space (0-1 ratio)
}

export function TimelineSidebar({
  className = '',
  onYearSelect,
  onDateSelect,
  distribution = [],
  hourlyDistribution = [],
  highlightedDate,
}: TimelineSidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouseY, setMouseY] = useState<number | null>(null)

  const CONTAINER_HEIGHT = 700 // px

  // Use hourly data if available, otherwise fall back to daily
  const useHourlyData = hourlyDistribution.length > 0

  // Flatten and sort data
  const allItems = useMemo(() => {
    if (useHourlyData) {
      // Use hourly data
      const sorted = [...hourlyDistribution].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      return sorted.map((d, i) => {
        const date = new Date(d.timestamp)
        return {
          timestamp: d.timestamp,
          count: d.count,
          year: date.getFullYear().toString(),
          month: date.getMonth(),
          day: date.getDate(),
          hour: date.getHours(),
          index: i,
          firstMsg: d.first_msg,
          lastMsg: d.last_msg
        } as TimeItem
      })
    } else {
      // Fall back to daily data
      if (!distribution || distribution.length === 0) return []
      const sorted = [...distribution].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      return sorted.map((d, i) => {
        const date = new Date(d.date)
        return {
          timestamp: d.date,
          count: d.count,
          year: date.getFullYear().toString(),
          month: date.getMonth(),
          day: date.getDate(),
          index: i
        } as TimeItem
      })
    }
  }, [distribution, hourlyDistribution, useHourlyData])

  // Extract year markers with their LINEAR positions (always consistent)
  const yearMarkers = useMemo(() => {
    if (allItems.length === 0) return []
    const markers: YearMarker[] = []
    let currentYear = ''

    allItems.forEach((item, i) => {
      if (item.year !== currentYear) {
        currentYear = item.year
        markers.push({
          year: item.year,
          startIndex: i,
          linearY: i / allItems.length // 0 to 1
        })
      }
    })
    return markers
  }, [allItems])

  const maxCount = useMemo(() => {
    if (allItems.length === 0) return 1
    return Math.max(...allItems.map(d => d.count))
  }, [allItems])

  // Color: Teal gradient for Solarized Light theme
  const getIntensityColor = (intensity: number, isHovered: boolean = false) => {
    if (isHovered) {
      return `rgba(42, 161, 152, 1)` // Full teal
    }
    // From light teal to deep teal based on intensity
    const alpha = 0.2 + 0.7 * intensity
    return `rgba(42, 161, 152, ${alpha})`
  }

  // Layout calculation with WAVE-like fisheye - SHARPER decay
  const layout = useMemo(() => {
    if (allItems.length === 0) return []

    const ITEM_COUNT = allItems.length

    // WAVE ZOOM CONFIG - Sharper focus
    const LENS_RADIUS = 8 // Core items with strong zoom (reduced from 12)
    const FALLOFF_RADIUS = 15 // Smooth transition zone
    const STABILITY_RADIUS = 25 // Beyond this, items DON'T MOVE AT ALL
    const MAX_ZOOM = 150 // Higher zoom at focal point

    const heights = new Float32Array(ITEM_COUNT)
    const baseHeight = CONTAINER_HEIGHT / ITEM_COUNT

    if (mouseY === null) {
      // No hover: uniform distribution
      heights.fill(baseHeight)
    } else {
      // Find target index
      const hoverRatio = Math.max(0, Math.min(1, mouseY / CONTAINER_HEIGHT))
      const targetIndex = Math.round(hoverRatio * (ITEM_COUNT - 1))

      // Calculate zoom factors with VERY SHARP falloff
      let extraHeightBudget = 0
      const zoomFactors = new Float32Array(ITEM_COUNT)

      for (let i = 0; i < ITEM_COUNT; i++) {
        const dist = Math.abs(i - targetIndex)

        if (dist > STABILITY_RADIUS) {
          // Outside stability zone: NO CHANGE
          zoomFactors[i] = 1
          heights[i] = baseHeight
        } else if (dist <= LENS_RADIUS) {
          // Inside lens: SUPER SHARP quartic decay
          // exp(-x⁴) is even sharper than exp(-x³)
          const normalized = dist / LENS_RADIUS
          const decay = Math.exp(-Math.pow(normalized, 4) * 4)
          zoomFactors[i] = 1 + (MAX_ZOOM - 1) * decay
          extraHeightBudget += (zoomFactors[i] - 1) * baseHeight
        } else if (dist <= FALLOFF_RADIUS) {
          // Fast falloff zone
          const normalized = (dist - LENS_RADIUS) / (FALLOFF_RADIUS - LENS_RADIUS)
          const decay = Math.exp(-normalized * 3) // Fast exponential drop
          zoomFactors[i] = 1 + decay * 1.5 // Small residual zoom
          extraHeightBudget += (zoomFactors[i] - 1) * baseHeight
        } else {
          // Transition zone: gentle blend to stability
          const transitionProgress = (dist - FALLOFF_RADIUS) / (STABILITY_RADIUS - FALLOFF_RADIUS)
          const eased = 1 - Math.pow(1 - transitionProgress, 3) // Cubic ease out
          zoomFactors[i] = 1 + (1 - eased) * 0.2 // Tiny residual
          extraHeightBudget += (zoomFactors[i] - 1) * baseHeight
        }
      }

      // Compress to fit
      const compressionFactor = CONTAINER_HEIGHT / (CONTAINER_HEIGHT + extraHeightBudget)

      for (let i = 0; i < ITEM_COUNT; i++) {
        const dist = Math.abs(i - targetIndex)
        if (dist <= STABILITY_RADIUS) {
          heights[i] = baseHeight * zoomFactors[i] * compressionFactor
        } else {
          heights[i] = baseHeight
        }
      }

      // Final adjustment to ensure total height is exactly CONTAINER_HEIGHT
      let total = 0
      for (let i = 0; i < ITEM_COUNT; i++) total += heights[i]
      const adjust = CONTAINER_HEIGHT / total
      for (let i = 0; i < ITEM_COUNT; i++) heights[i] *= adjust
    }

    // Compute positions
    const positions = []
    let currentY = 0
    for (let i = 0; i < ITEM_COUNT; i++) {
      positions.push({ y: currentY, height: heights[i], item: allItems[i] })
      currentY += heights[i]
    }
    return positions
  }, [allItems, mouseY, CONTAINER_HEIGHT])

  // Find hovered item for tooltip
  const hoveredItem = useMemo(() => {
    if (mouseY === null || layout.length === 0) return null
    return layout.find(p => mouseY >= p.y && mouseY < p.y + p.height) || null
  }, [layout, mouseY])

  // Calculate position of highlighted date (from message hover)
  const highlightedPosition = useMemo(() => {
    if (!highlightedDate || allItems.length === 0) return null

    const highlightTime = new Date(highlightedDate).getTime()

    // Find the closest item to this date
    let closestIndex = 0
    let minDiff = Infinity

    for (let i = 0; i < allItems.length; i++) {
      const itemTime = new Date(allItems[i].timestamp).getTime()
      const diff = Math.abs(itemTime - highlightTime)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }

    // Calculate Y position (linear, no fisheye when just highlighting)
    const ratio = closestIndex / (allItems.length - 1 || 1)
    const y = ratio * CONTAINER_HEIGHT

    // Format the date for display
    const date = new Date(highlightedDate)
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    const formattedTime = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })

    return { y, formattedDate, formattedTime }
  }, [highlightedDate, allItems, CONTAINER_HEIGHT])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMouseY(e.clientY - rect.top)
  }

  const handleMouseLeave = () => setMouseY(null)

  return (
    <div className={`w-44 border-r border-[var(--border-subtle)] bg-[var(--abyss)] flex flex-col items-center py-3 ${className}`}>

      {/* Fixed Year Labels - Always visible on the left */}
      <div className="relative w-full flex-1">

        {/* Year markers layer - FIXED positions based on linear distribution */}
        <div
          className="absolute left-0 top-0 w-10 pointer-events-none select-none"
          style={{ height: CONTAINER_HEIGHT }}
        >
          {yearMarkers.map((marker, i) => {
            const nextMarker = yearMarkers[i + 1]
            const startY = marker.linearY * CONTAINER_HEIGHT
            const endY = nextMarker ? nextMarker.linearY * CONTAINER_HEIGHT : CONTAINER_HEIGHT
            const height = endY - startY

            return (
              <div
                key={marker.year}
                className="absolute left-0 flex items-start"
                style={{ top: startY, height }}
              >
                {/* Year label */}
                <span className="text-[10px] font-mono font-bold text-[var(--accent)] pl-1 leading-none">
                  {marker.year}
                </span>
                {/* Vertical line for this year's span */}
                <div
                  className="absolute left-0 w-px bg-[var(--accent)]/30"
                  style={{ top: 12, height: Math.max(0, height - 14) }}
                />
              </div>
            )
          })}
        </div>

        {/* Waveform container - CLICK ANYWHERE to navigate */}
        <div
          ref={containerRef}
          className="absolute left-10 right-0 cursor-crosshair"
          style={{ height: CONTAINER_HEIGHT }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            // Click anywhere navigates to the hovered item (use date part only for navigation)
            if (hoveredItem) {
              // Extract just the date part for navigation (YYYY-MM-DD)
              const dateOnly = hoveredItem.item.timestamp.split('T')[0]
              onDateSelect?.(dateOnly)
            }
          }}
        >
          {/* Baseline */}
          <div className="absolute top-0 bottom-0 left-0 w-px bg-[var(--border-default)]" />

          {/* SVG Waveform */}
          <svg
            className="w-full h-full overflow-visible pointer-events-none"
            viewBox={`0 0 100 ${CONTAINER_HEIGHT}`}
            preserveAspectRatio="none"
          >
            {/* Glow filter for hovered bar */}
            <defs>
              <filter id="waveGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Gradient for intensity wave effect */}
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {layout.map((p, idx) => {
              const { item, y, height } = p
              const intensity = Math.min(item.count / (maxCount * 0.5), 1)
              const barWidth = Math.max(intensity * 85 + 8, 8)

              if (height < 0.15 && intensity < 0.15) return null

              const isHovered = hoveredItem?.item.timestamp === item.timestamp

              // Calculate distance from hover for wave effect
              let waveOpacity = 0.15 + 0.5 * intensity
              if (mouseY !== null && hoveredItem) {
                const hoveredIdx = layout.findIndex(l => l.item.timestamp === hoveredItem.item.timestamp)
                const distFromHover = Math.abs(idx - hoveredIdx)

                if (distFromHover === 0) {
                  waveOpacity = 1
                } else if (distFromHover <= 3) {
                  // Sharp decay near hover
                  waveOpacity = 0.7 * Math.exp(-distFromHover * 0.8)
                } else if (distFromHover <= 8) {
                  // Gentler decay further out
                  waveOpacity = 0.2 * Math.exp(-(distFromHover - 3) * 0.4)
                } else {
                  waveOpacity = 0.08 + 0.3 * intensity
                }
              }

              const barColor = isHovered
                ? 'var(--warm)'
                : `rgba(42, 161, 152, ${waveOpacity})`

              return (
                <rect
                  key={item.timestamp}
                  x="0"
                  y={y}
                  width={isHovered ? Math.max(barWidth + 10, 50) : barWidth}
                  height={Math.max(height, 0.3)}
                  fill={barColor}
                  rx={isHovered ? 2 : 0}
                  filter={isHovered ? 'url(#waveGlow)' : undefined}
                  style={{
                    transition: 'fill 0.08s ease-out, width 0.08s ease-out',
                  }}
                />
              )
            })}
          </svg>

          {/* Highlighted message indicator - shows when hovering a message in the list */}
          {highlightedPosition && mouseY === null && (
            <div
              className="absolute left-0 right-0 pointer-events-none z-40 transition-all duration-150"
              style={{ top: highlightedPosition.y }}
            >
              {/* Horizontal line */}
              <div className="absolute left-0 right-0 h-px bg-[var(--warm)]" />
              {/* Small triangle indicator */}
              <div
                className="absolute left-0 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-[var(--warm)]"
                style={{ top: -4 }}
              />
              {/* Date/time badge */}
              <div
                className="absolute left-full ml-2 px-2 py-0.5 bg-[var(--warm)]/10 border border-[var(--warm)]/30 rounded text-[10px] font-mono text-[var(--warm)] whitespace-nowrap"
                style={{ top: -8 }}
              >
                {highlightedPosition.formattedDate} · {highlightedPosition.formattedTime}
              </div>
            </div>
          )}

          {/* Tooltip - shows hour when using hourly data */}
          {hoveredItem && mouseY !== null && (
            <div
              className="absolute left-full ml-3 z-50 px-3 py-1.5 bg-[var(--card)] border border-[var(--border-accent)] rounded-lg text-xs font-mono text-[var(--text-bright)] whitespace-nowrap pointer-events-none shadow-lg"
              style={{ top: mouseY - 12 }}
            >
              <span className="text-[var(--text-primary)]">
                {new Date(hoveredItem.item.timestamp).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
                {/* Show hour if available (hourly data) */}
                {hoveredItem.item.hour !== undefined && (
                  <span className="text-[var(--accent)] ml-1 font-semibold">
                    {String(hoveredItem.item.hour).padStart(2, '0')}:00
                  </span>
                )}
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
