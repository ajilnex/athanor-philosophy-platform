'use client'

import React from 'react'

interface GlassDashboardProps {
  children: React.ReactNode
  className?: string
}

export function GlassDashboard({ children, className = '' }: GlassDashboardProps) {
  return (
    <div
      className={`fixed inset-0 bg-[var(--void)] text-[var(--text-primary)] selection:bg-[var(--accent-dim)] selection:text-[var(--text-bright)] overflow-hidden z-[100] ${className}`}
    >
      {/* Background Layers - Subtle warm texture */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Warm gradient overlays */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 40%, rgba(42, 161, 152, 0.04) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(108, 113, 196, 0.03) 0%, transparent 50%),
              radial-gradient(ellipse 100% 80% at 50% 100%, rgba(203, 75, 22, 0.02) 0%, transparent 40%)
            `,
          }}
        />

        {/* Subtle paper texture feel */}
        <div
          className="absolute inset-0 tech-grid-bg opacity-20"
        />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 h-screen flex flex-col">{children}</div>
    </div>
  )
}
