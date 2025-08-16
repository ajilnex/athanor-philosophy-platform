'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { BibliographyEntry } from '@/lib/bibliography'

interface BibliographyIndexProps {
  className?: string
}

export function BibliographyIndex({ className = '' }: BibliographyIndexProps) {
  const [bibliography, setBibliography] = useState<BibliographyEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/bibliography.json')
      .then(response => response.json())
      .then(setBibliography)
      .catch(error => console.error('Erreur lors du chargement de la bibliographie:', error))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className={className}>
        <p className="text-subtle">Chargement de l'index bibliographique...</p>
      </div>
    )
  }

  if (bibliography.length === 0) {
    return (
      <div className={className}>
        <p className="text-subtle">Aucune référence disponible pour le moment.</p>
      </div>
    )
  }

  // Grouper par première lettre du nom de famille du premier auteur
  const groupedByLetter = bibliography.reduce(
    (groups, entry) => {
      const firstAuthor = entry.authors[0]
      const letter = firstAuthor?.family?.[0]?.toUpperCase() || '#'

      if (!groups[letter]) {
        groups[letter] = []
      }
      groups[letter].push(entry)

      return groups
    },
    {} as Record<string, BibliographyEntry[]>
  )

  // Trier les lettres
  const sortedLetters = Object.keys(groupedByLetter).sort()

  return (
    <div className={className}>
      <div className="space-y-8">
        {sortedLetters.map(letter => (
          <div key={letter}>
            <h3 className="text-lg font-serif font-medium text-foreground mb-4 border-b border-subtle/20 pb-2">
              {letter}
            </h3>

            <div className="space-y-3">
              {groupedByLetter[letter].map(entry => {
                const primaryAuthor = entry.authors[0]
                const authorName = primaryAuthor
                  ? `${primaryAuthor.family}, ${primaryAuthor.given}`
                  : 'Auteur inconnu'

                const additionalAuthors = entry.authors.length > 1 ? ` et al.` : ''

                return (
                  <div key={entry.key} className="text-sm">
                    <Link
                      href={`/refs/${entry.key}`}
                      className="hover:text-accent transition-colors"
                    >
                      <span className="font-medium">
                        {authorName}
                        {additionalAuthors}
                      </span>
                      <span className="text-subtle mx-2">—</span>
                      <span className="text-subtle">{entry.year || 's.d.'}</span>
                      <span className="text-subtle mx-2">—</span>
                      <span className="text-foreground">{entry.title}</span>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
