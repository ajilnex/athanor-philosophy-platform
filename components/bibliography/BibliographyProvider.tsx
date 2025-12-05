'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { BibliographyEntry, loadBibliography } from '@/lib/bibliography'

interface BibliographyContextType {
  bibliography: BibliographyEntry[]
  citations: string[] // Ordre d'apparition des citations dans le texte
  addCitation: (key: string) => number // Retourne le numéro de citation
  getCitationNumber: (key: string) => number | null
  isLoading: boolean
}

const BibliographyContext = createContext<BibliographyContextType | null>(null)

export function BibliographyProvider({ children }: { children: React.ReactNode }) {
  const [bibliography, setBibliography] = useState<BibliographyEntry[]>([])
  const [citations, setCitations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Use ref to track citations without causing re-renders
  const citationsRef = useRef<string[]>([])

  useEffect(() => {
    loadBibliography()
      .then(setBibliography)
      .finally(() => setIsLoading(false))
  }, [])

  // Sync ref with state
  useEffect(() => {
    citationsRef.current = citations
  }, [citations])

  const addCitation = useCallback((key: string): number => {
    const currentCitations = citationsRef.current
    const existingIndex = currentCitations.indexOf(key)

    if (existingIndex !== -1) {
      return existingIndex + 1 // Already exists, return its number
    }

    // Add new citation
    const newCitations = [...currentCitations, key]
    citationsRef.current = newCitations
    setCitations(newCitations)

    return newCitations.length
  }, [])

  const getCitationNumber = useCallback((key: string): number | null => {
    const index = citationsRef.current.indexOf(key)
    return index !== -1 ? index + 1 : null
  }, [])

  return (
    <BibliographyContext.Provider
      value={{
        bibliography,
        citations,
        addCitation,
        getCitationNumber,
        isLoading,
      }}
    >
      {children}
    </BibliographyContext.Provider>
  )
}

export function useBibliography() {
  const context = useContext(BibliographyContext)
  if (!context) {
    throw new Error('useBibliography doit être utilisé dans un BibliographyProvider')
  }
  return context
}
