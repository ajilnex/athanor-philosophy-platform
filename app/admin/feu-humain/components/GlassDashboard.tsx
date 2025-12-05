'use client'

import React from 'react'

interface GlassDashboardProps {
  children: React.ReactNode
  className?: string
}

export function GlassDashboard({ children, className = '' }: GlassDashboardProps) {
  return (
    <div
      className={`min-h-screen bg-[var(--void)] text-[var(--text-primary)] selection:bg-[var(--accent-dim)] selection:text-[var(--accent)] overflow-hidden relative ${className}`}
    >
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Abstract Fluid Gradient - More sophisticated */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 40%, rgba(64, 224, 208, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 60%, rgba(157, 140, 255, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 100% 80% at 50% 100%, rgba(244, 162, 97, 0.04) 0%, transparent 40%)
            `,
            filter: 'blur(80px)',
          }}
        />

        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 tech-grid-bg opacity-30" />

        {/* Top-down gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, var(--void) 100%)',
            opacity: 0.5,
          }}
        />

        {/* Vignette - softer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--void)_80%)]" />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 h-screen flex flex-col">{children}</div>
    </div>
  )
}
