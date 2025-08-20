'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  loading?: 'lazy' | 'eager'
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (hasError || !src) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center`}
        style={{ width: '100%', height: `${height}px` }}
      >
        <div className="text-gray-400 text-xs">Image non disponible</div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div
          className={`${className} bg-gray-100 animate-pulse absolute inset-0 flex items-center justify-center z-10`}
        >
          <div className="text-gray-400 text-xs">Chargement...</div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        unoptimized={!src.includes('res.cloudinary.com')}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
}
