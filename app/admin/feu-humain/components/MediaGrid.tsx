
import React, { useState } from 'react'
import Image from 'next/image'
import { Film, Music, Image as ImageIcon, AlertCircle } from 'lucide-react'

interface MediaItem {
    id: string
    type: string
    url: string
    thumb?: string | null
    name?: string | null
    width?: number | null
    height?: number | null
}

interface MediaGridProps {
    media: MediaItem[]
    onMediaClick: (media: MediaItem) => void
}

export function MediaGrid({ media, onMediaClick }: MediaGridProps) {
    if (!media || media.length === 0) return null

    // Determine grid layout based on count
    const gridClass =
        media.length === 1
            ? 'grid-cols-1 max-w-[320px]' // Increased max-width for single items
            : media.length === 2
                ? 'grid-cols-2 max-w-2xl'
                : 'grid-cols-3 max-w-3xl'

    return (
        <div className={`grid gap-2 mt-3 ${gridClass}`}>
            {media.map(item => (
                <MediaItem key={item.id} item={item} onClick={() => onMediaClick(item)} />
            ))}
        </div>
    )
}

function MediaItem({ item, onClick }: { item: MediaItem; onClick: () => void }) {
    const [error, setError] = useState(false)

    return (
        <div
            onClick={onClick}
            className="relative w-full overflow-hidden rounded border border-[rgba(255,255,255,0.1)] bg-black/20 cursor-pointer group hover:border-[#00f0ff] transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]"
        >
            {item.type === 'photo' ? (
                error ? (
                    <div className="w-full aspect-square flex flex-col items-center justify-center text-white/30 gap-2 p-2">
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-[10px] font-mono text-center break-all">
                            ERR_LOAD
                        </span>
                    </div>
                ) : (
                    <>
                        <Image
                            src={item.thumb || item.url}
                            alt="Media"
                            width={item.width || 500}
                            height={item.height || 500}
                            className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            onError={() => setError(true)}
                            unoptimized={true}
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-[#00f0ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </>
                )
            ) : (
                <div className="w-full aspect-video flex items-center justify-center group-hover:bg-[#00f0ff]/5 transition-colors relative">
                    {item.type === 'video' ? (
                        <Film className="w-8 h-8 text-white/40 group-hover:text-[#00f0ff] transition-colors relative z-10" />
                    ) : (
                        <Music className="w-8 h-8 text-white/40 group-hover:text-[#00f0ff] transition-colors relative z-10" />
                    )}

                    {/* Type Label */}
                    <div className="absolute bottom-2 right-2 text-[9px] font-mono text-[#00f0ff] bg-black/60 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {item.type.toUpperCase()}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-[#00f0ff]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
            )}
        </div>
    )
}
