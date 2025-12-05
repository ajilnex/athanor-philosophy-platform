'use client'

import React from 'react'

interface StatsPanelProps {
  stats: {
    totalMessages: number
    participantCount: number
    photos: number
    videos: number
  }
  className?: string
}

export function StatsPanel({ stats, className = '' }: StatsPanelProps) {
  return (
    <div className={`glass-panel p-4 rounded-lg mb-8 ${className}`}>
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] pb-2 mb-4">
        <h3 className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
          System Status
        </h3>
        <div className="flex gap-4 text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
          <span>MEM: 4.2GB</span>
          <span>LAT: 12ms</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-8 justify-between md:justify-start">
        <StatItem label="Total Msgs" value={stats.totalMessages} />
        <StatItem label="Active Users" value={stats.participantCount} />
        <StatItem label="IMG Data" value={stats.photos} />
        <StatItem label="VID Data" value={stats.videos} />
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] font-mono text-[rgba(255,255,255,0.4)] uppercase mb-1">
        {label}
      </span>
      <span className="text-sm font-mono text-white tabular-nums">{value.toLocaleString()}</span>
    </div>
  )
}
