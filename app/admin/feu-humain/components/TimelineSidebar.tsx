'use client'

import React from 'react'

interface TimelineSidebarProps {
  startDate?: string
  endDate?: string
  currentDate?: string
  className?: string
}

export function TimelineSidebar({
  startDate,
  endDate,
  currentDate,
  className = '',
}: TimelineSidebarProps) {
  // Mock years for visual structure if dates aren't provided
  const years = ['2018', '2019', '2020', '2021', '2022', '2023', '2024']

  return (
    <div
      className={`w-16 border-r border-[rgba(255,255,255,0.08)] bg-[rgba(5,5,5,0.6)] backdrop-blur-md flex flex-col items-center py-8 ${className}`}
    >
      <div className="flex-1 flex flex-col justify-between items-center w-full relative">
        {/* Vertical Line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[rgba(255,255,255,0.1)] -translate-x-1/2" />

        {years.map(year => (
          <div
            key={year}
            className="relative z-10 flex flex-col items-center gap-1 group cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.2)] group-hover:bg-[#00f0ff] transition-colors" />
            <span className="text-[10px] font-mono text-[rgba(255,255,255,0.4)] group-hover:text-white transition-colors -rotate-90 origin-center translate-y-2">
              {year}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-[rgba(255,255,255,0.1)] w-full flex justify-center">
        <div className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.2)] flex items-center justify-center text-[10px] font-mono text-[rgba(255,255,255,0.5)]">
          NOW
        </div>
      </div>
    </div>
  )
}
