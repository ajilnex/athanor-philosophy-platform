'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useBibliography } from './BibliographyProvider'
import { findEntry, formatShortCitation } from '@/lib/bibliography'
import { ExternalLink } from 'lucide-react'

interface CiteProps {
  item: string // Clé de citation
  className?: string
}

export function Cite({ item, className = '' }: CiteProps) {
  const { bibliography, addCitation, getCitationNumber, isLoading } = useBibliography()
  const [citationNumber, setCitationNumber] = useState<number | null>(null)
  const [showPopover, setShowPopover] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Register citation in useEffect to avoid setState during render
  useEffect(() => {
    if (!isLoading && bibliography.length > 0) {
      const entry = findEntry(bibliography, item)
      if (entry) {
        const num = addCitation(item)
        setCitationNumber(num)
      }
    }
  }, [item, isLoading, bibliography, addCitation])

  // Handle hover with delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPopover(true), 200)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShowPopover(false), 150)
  }

  if (isLoading) {
    return <span className="text-subtle">[...]</span>
  }

  // Vérifier que l'entrée existe
  const entry = findEntry(bibliography, item)
  if (!entry) {
    console.error(`Citation introuvable: "${item}"`)
    return (
      <span className="text-red-600 font-bold" title={`Citation introuvable: ${item}`}>
        [?]
      </span>
    )
  }

  const shortCitation = formatShortCitation(entry)
  const displayNumber = citationNumber ?? getCitationNumber?.(item) ?? '...'

  // Truncate abstract for popover
  const truncatedAbstract = entry.container
    ? entry.container.length > 150
      ? entry.container.substring(0, 150) + '...'
      : entry.container
    : null

  return (
    <span
      className={`inline-block relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <sup>
        <a
          href={`/refs/${item}`}
          className="text-accent hover:text-accent/70 no-underline font-medium"
          title={shortCitation}
        >
          [{displayNumber}]
        </a>
      </sup>

      {/* Rich Popover */}
      {showPopover && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80"
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            setShowPopover(true)
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white border border-subtle/30 rounded-lg shadow-xl p-4 text-left animate-fadeIn">
            {/* Title */}
            <h4 className="font-medium text-sm text-foreground leading-snug mb-2 line-clamp-2">
              {entry.title}
            </h4>

            {/* Author & Year */}
            <p className="text-xs text-subtle mb-2">
              {shortCitation}
            </p>

            {/* Container/Abstract */}
            {truncatedAbstract && (
              <p className="text-xs text-subtle/80 italic mb-3 line-clamp-3">
                {truncatedAbstract}
              </p>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 text-xs">
              <a
                href={`/refs/${item}`}
                className="text-accent hover:underline"
              >
                Voir la référence
              </a>
              {entry.DOI && (
                <a
                  href={`https://doi.org/${entry.DOI}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-accent hover:underline"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  DOI
                </a>
              )}
              {!entry.DOI && entry.URL && (
                <a
                  href={entry.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-accent hover:underline"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Lien
                </a>
              )}
            </div>

            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
          </div>
        </div>
      )}
    </span>
  )
}
