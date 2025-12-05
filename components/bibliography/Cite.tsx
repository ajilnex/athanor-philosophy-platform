'use client'

import React, { useEffect, useState } from 'react'
import { useBibliography } from './BibliographyProvider'
import { findEntry, formatShortCitation } from '@/lib/bibliography'

interface CiteProps {
  item: string // Clé de citation
  className?: string
}

export function Cite({ item, className = '' }: CiteProps) {
  const { bibliography, addCitation, getCitationNumber, isLoading } = useBibliography()
  const [citationNumber, setCitationNumber] = useState<number | null>(null)

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

  return (
    <span className={`inline-block ${className}`}>
      <sup>
        <a
          href={`/refs/${item}`}
          className="text-accent hover:text-accent/70 no-underline font-medium"
          title={shortCitation}
        >
          [{displayNumber}]
        </a>
      </sup>
    </span>
  )
}
