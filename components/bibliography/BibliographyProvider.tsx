'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { BibliographyEntry, loadBibliography } from '@/lib/bibliography'

interface BibliographyContextType {
  bibliography: BibliographyEntry[]
  citations: string[] // Ordre d'apparition des citations dans le texte
  addCitation: (key: string) => number // Retourne le numéro de citation
  isLoading: boolean
}

const BibliographyContext = createContext<BibliographyContextType | null>(null)

export function BibliographyProvider({ children }: { children: React.ReactNode }) {
  const [bibliography, setBibliography] = useState<BibliographyEntry[]>([])
  const [citations, setCitations] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadBibliography()
      .then(setBibliography)
      .finally(() => setIsLoading(false))
  }, [])

  const addCitation = (key: string): number => {
    setCitations(prev => {
      const existingIndex = prev.indexOf(key)
      if (existingIndex !== -1) {
        return prev // Déjà présent
      }
      return [...prev, key]
    })
    
    // Retourne le numéro de citation (1-indexé)
    const currentIndex = citations.indexOf(key)
    return currentIndex !== -1 ? currentIndex + 1 : citations.length + 1
  }

  return (
    <BibliographyContext.Provider value={{
      bibliography,
      citations,
      addCitation,
      isLoading
    }}>
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