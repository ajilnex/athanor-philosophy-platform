'use client'

import React from 'react'
import { useBibliography } from './BibliographyProvider'
import { findEntry, formatShortCitation } from '@/lib/bibliography'

interface CiteProps {
  item: string // Clé de citation
  className?: string
}

export function Cite({ item, className = '' }: CiteProps) {
  const { bibliography, addCitation, isLoading } = useBibliography()
  
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

  // Ajouter la citation et obtenir son numéro
  const citationNumber = addCitation(item)
  const shortCitation = formatShortCitation(entry)

  return (
    <span className={`inline-block ${className}`}>
      <sup>
        <a
          href={`#ref-${item}`}
          className="text-accent hover:text-accent/70 no-underline font-medium"
          title={shortCitation}
        >
          [{citationNumber}]
        </a>
      </sup>
    </span>
  )
}