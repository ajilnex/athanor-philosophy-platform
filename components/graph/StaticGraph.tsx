'use client'

import { useEffect, useState, useRef } from 'react'

interface StaticGraphProps {
  className?: string
}

export function StaticGraph({ className = '' }: StaticGraphProps) {
  const [svgContent, setSvgContent] = useState<string>('')

  useEffect(() => {
    async function loadSVG() {
      try {
        const response = await fetch('/graph-billets.svg')
        if (response.ok) {
          const svgText = await response.text()
          setSvgContent(svgText)
        }
      } catch (error) {
        console.error('Erreur lors du chargement du graphe:', error)
      }
    }

    loadSVG()
  }, [])

  if (!svgContent) {
    return null // Pas de loader pour le fond statique
  }

  return (
    <div className={`${className}`}>
      {/* Graphe statique en arrière-plan (non-interactif) */}
      <div
        className="interactive-graph-background"
        style={{ pointerEvents: 'none' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  )
}
