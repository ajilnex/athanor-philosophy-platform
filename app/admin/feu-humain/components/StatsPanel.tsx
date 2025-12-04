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
    <div className={`glass-panel p-4 rounded-lg space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] pb-2">
        <h3 className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest">
          System Status
        </h3>
        <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatItem label="Total Msgs" value={stats.totalMessages} />
        <StatItem label="Active Users" value={stats.participantCount} />
        <StatItem label="IMG Data" value={stats.photos} />
        <StatItem label="VID Data" value={stats.videos} />
      </div>

      <div className="pt-2 border-t border-[rgba(255,255,255,0.05)]">
        <div className="flex justify-between text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
          <span>MEM: 4.2GB</span>
          <span>LAT: 12ms</span>
        </div>
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
