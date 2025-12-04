'use client'

import React from 'react'

interface GlassDashboardProps {
  children: React.ReactNode
  className?: string
}

export function GlassDashboard({ children, className = '' }: GlassDashboardProps) {
  return (
    <div
      className={`min-h-screen bg-black text-white selection:bg-[rgba(0,240,255,0.2)] selection:text-[#00f0ff] overflow-hidden relative ${className}`}
    >
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Abstract Fluid Gradient */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(0, 40, 60, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(40, 0, 20, 0.3) 0%, transparent 50%)
            `,
            filter: 'blur(60px)',
          }}
        />

        {/* Tech Grid Overlay */}
        <div className="absolute inset-0 tech-grid-bg" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* Main Content Layer */}
      <div className="relative z-10 h-screen flex flex-col">{children}</div>
    </div>
  )
}
