'use client'

import React from 'react'
import { useBibliography } from './BibliographyProvider'
import { findEntry, formatFullCitation } from '@/lib/bibliography'

interface BibliographyProps {
  className?: string
}

export function Bibliography({ className = '' }: BibliographyProps) {
  const { bibliography, citations, isLoading } = useBibliography()

  if (isLoading) {
    return (
      <div className={`mt-8 pt-6 border-t border-subtle/20 ${className}`}>
        <h3 className="text-lg font-serif font-light text-foreground mb-4">Références</h3>
        <div className="text-subtle">Chargement de la bibliographie...</div>
      </div>
    )
  }

  // Ne rien afficher s'il n'y a pas de citations
  if (citations.length === 0) {
    return null
  }

  // Filtrer et ordonner selon l'ordre d'apparition
  const citedEntries = citations
    .map(key => findEntry(bibliography, key))
    .filter(entry => entry !== null)

  return (
    <div className={`mt-12 pt-8 border-t border-subtle/20 ${className}`}>
      <h3 className="text-xl font-serif font-light text-foreground mb-6">Références</h3>

      <ol className="space-y-4">
        {citedEntries.map((entry, index) => {
          if (!entry) return null

          const fullCitation = formatFullCitation(entry)

          return (
            <li key={entry.key} id={`ref-${entry.key}`} className="text-sm leading-relaxed">
              <span className="text-subtle font-medium mr-2">[{index + 1}]</span>

              <span className="text-foreground">{fullCitation}</span>

              {/* Liens vers DOI ou URL */}
              {entry.DOI && (
                <span className="ml-2">
                  <a
                    href={`https://doi.org/${entry.DOI}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/70 text-xs"
                  >
                    DOI
                  </a>
                </span>
              )}

              {!entry.DOI && entry.URL && (
                <span className="ml-2">
                  <a
                    href={entry.URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent/70 text-xs"
                  >
                    Lien
                  </a>
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
