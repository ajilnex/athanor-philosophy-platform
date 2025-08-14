'use client'

import { useEffect, useState, useRef } from 'react'

interface InteractiveGraphProps {
  className?: string
}

export function InteractiveGraph({ className = '' }: InteractiveGraphProps) {
  const [svgContent, setSvgContent] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!svgContent || !containerRef.current) return

    const container = containerRef.current
    const svgElement = container.querySelector('svg')
    if (!svgElement) return

    // Construire table d'adjacence pour performance
    const adjacencyMap = new Map<string, Set<string>>()
    const edges = svgElement.querySelectorAll('.edge')
    edges.forEach(edge => {
      const source = edge.getAttribute('data-source')
      const target = edge.getAttribute('data-target')
      if (source && target) {
        if (!adjacencyMap.has(source)) adjacencyMap.set(source, new Set())
        if (!adjacencyMap.has(target)) adjacencyMap.set(target, new Set())
        adjacencyMap.get(source)?.add(target)
        adjacencyMap.get(target)?.add(source)
      }
    })

    // Créer le portal overlay avec positionnement exact
    const containerRect = container.getBoundingClientRect()
    const overlayContainer = document.createElement('div')
    overlayContainer.style.cssText = `
      position: fixed;
      left: ${containerRect.left}px;
      top: ${containerRect.top}px;
      width: ${containerRect.width}px;
      height: ${containerRect.height}px;
      z-index: 40;
      pointer-events: none;
    `
    document.body.appendChild(overlayContainer)

    const overlayElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    overlayElement.setAttribute('viewBox', '0 0 1440 820')
    overlayElement.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    overlayElement.style.cssText = `
      width: 100%;
      height: 100%;
      pointer-events: none;
    `
    
    // Ajuster la position lors du redimensionnement
    const updateOverlayPosition = () => {
      const newRect = container.getBoundingClientRect()
      overlayContainer.style.left = newRect.left + 'px'
      overlayContainer.style.top = newRect.top + 'px'
      overlayContainer.style.width = newRect.width + 'px'
      overlayContainer.style.height = newRect.height + 'px'
    }
    
    window.addEventListener('resize', updateOverlayPosition)
    window.addEventListener('scroll', updateOverlayPosition)
    
    // Définitions de filtres
    overlayElement.innerHTML = `
      <defs>
        <filter id="clone-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `
    
    overlayContainer.appendChild(overlayElement)

    // Créer les hit areas invisibles pour tous les nœuds
    const nodes = svgElement.querySelectorAll('[data-id]')
    nodes.forEach(node => {
      const nodeId = node.getAttribute('data-id')
      const originalLink = node.closest('a')
      if (!nodeId || !originalLink) return
      
      const href = originalLink.getAttribute('href')
      const circle = node.querySelector('circle')
      if (!circle) return
      
      const cx = parseFloat(circle.getAttribute('cx') || '0')
      const cy = parseFloat(circle.getAttribute('cy') || '0')
      const r = parseFloat(circle.getAttribute('r') || '0')
      
      // Hit area invisible mais cliquable (réduite)
      const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      hitArea.innerHTML = `
        <a href="${href}" style="pointer-events: auto;">
          <circle cx="${cx}" cy="${cy}" r="${r + 5}" 
                  fill="transparent" 
                  stroke="none" 
                  data-id="${nodeId}"
                  class="hit-area"
                  tabindex="0"
                  aria-label="Aller au billet: ${node.querySelector('title')?.textContent || nodeId}"/>
        </a>
      `
      
      overlayElement.appendChild(hitArea)
    })

    let activeNode: string | null = null
    let timeoutId: number | null = null
    const cloneElements = new Map<string, SVGGElement>()

    // Helper pour vérifier si on est au-dessus d'une zone shield
    function isOverShield(clientX: number, clientY: number): boolean {
      // Désactive l'overlay ET le SVG de fond pour jeter un coup d'œil en dessous
      const prevOverlay = overlayElement.style.pointerEvents
      const prevBackground = container.style.pointerEvents
      const backgroundSvg = container.querySelector('svg')
      const prevBackgroundSvg = backgroundSvg?.style.pointerEvents
      
      overlayElement.style.pointerEvents = 'none'
      container.style.pointerEvents = 'none'
      if (backgroundSvg) backgroundSvg.style.pointerEvents = 'none'
      
      const below = document.elementFromPoint(clientX, clientY)
      
      overlayElement.style.pointerEvents = prevOverlay
      container.style.pointerEvents = prevBackground
      if (backgroundSvg && prevBackgroundSvg !== undefined) {
        backgroundSvg.style.pointerEvents = prevBackgroundSvg
      }
      
      const hasShield = !!below && !!(below as HTMLElement).closest('[data-graph-shield]')
      console.log('Shield check:', { clientX, clientY, below: below?.tagName, className: (below as HTMLElement)?.className, hasShield })
      
      return hasShield
    }

    function createClone(nodeId: string) {
      if (!svgElement) return
      const originalNode = svgElement.querySelector(`[data-id="${nodeId}"]`)
      const originalLink = originalNode?.closest('a')
      if (!originalNode || !originalLink) return
      
      const href = originalLink.getAttribute('href')
      const originalCircle = originalNode.querySelector('circle.node-main')
      const originalText = originalNode.querySelector('text')
      if (!originalCircle) return
      
      // Copier exactement les attributs du nœud principal
      const cx = originalCircle.getAttribute('cx')
      const cy = originalCircle.getAttribute('cy')
      const r = originalCircle.getAttribute('r')
      const fill = originalCircle.getAttribute('fill')
      const stroke = originalCircle.getAttribute('stroke')
      const strokeWidth = originalCircle.getAttribute('stroke-width')
      
      // Copier les attributs du texte original si il existe
      const textX = originalText?.getAttribute('x') || cx
      const textY = originalText?.getAttribute('y') || cy
      const fontSize = originalText?.getAttribute('font-size') || '12'
      const fontFamily = originalText?.getAttribute('font-family') || 'IBM Plex Serif, serif'
      const textContent = originalText?.textContent || ''
      
      const cloneGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      cloneGroup.innerHTML = `
        <a href="${href}" style="pointer-events: auto; text-decoration: none;">
          <circle cx="${cx}" cy="${cy}" r="${parseFloat(r || '0') + 4}" 
                  fill="hsl(220, 90%, 55%)" opacity="0.3" filter="url(#clone-glow)"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" 
                  fill="hsl(220, 90%, 55%)" stroke="${stroke || 'hsl(220, 10%, 98%)'}" stroke-width="${strokeWidth || '1'}" opacity="1"/>
          ${originalText ? `
          <text x="${textX}" y="${textY}" 
                text-anchor="middle" font-size="${fontSize}" 
                font-family="${fontFamily}" fill="hsl(220, 15%, 20%)"
                paint-order="stroke" stroke="hsl(220, 10%, 98%)" stroke-width="3px"
                style="text-decoration: none;">
            ${textContent}
          </text>` : ''}
        </a>
      `
      
      overlayElement.appendChild(cloneGroup)
      cloneElements.set(nodeId, cloneGroup)
      
      // Créer des clones des arêtes connectées
      const edgesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      const neighbors = adjacencyMap.get(nodeId) || new Set()
      
      neighbors.forEach(neighborId => {
        if (!svgElement) return
        const neighborNode = svgElement.querySelector(`[data-id="${neighborId}"]`)
        if (neighborNode) {
          const neighborCircle = neighborNode.querySelector('circle.node-main')
          if (neighborCircle) {
            const neighborCx = parseFloat(neighborCircle.getAttribute('cx') || '0')
            const neighborCy = parseFloat(neighborCircle.getAttribute('cy') || '0')
            
            // Créer clone de l'arête
            const edgeClone = document.createElementNS('http://www.w3.org/2000/svg', 'line')
            edgeClone.setAttribute('x1', cx || '0')
            edgeClone.setAttribute('y1', cy || '0')
            edgeClone.setAttribute('x2', neighborCx.toString())
            edgeClone.setAttribute('y2', neighborCy.toString())
            edgeClone.setAttribute('stroke', 'hsl(220, 90%, 55%)')
            edgeClone.setAttribute('stroke-width', '1')
            edgeClone.setAttribute('opacity', '0.4')
            
            edgesGroup.appendChild(edgeClone)
          }
        }
      })
      
      if (edgesGroup.children.length > 0) {
        overlayElement.appendChild(edgesGroup)
        cloneElements.set(`${nodeId}-edges`, edgesGroup)
      }
    }

    function removeClone(nodeId: string) {
      const cloneElement = cloneElements.get(nodeId)
      if (cloneElement) {
        overlayElement.removeChild(cloneElement)
        cloneElements.delete(nodeId)
      }
      
      // Supprimer les clones d'arêtes
      const edgesGroup = cloneElements.get(`${nodeId}-edges`)
      if (edgesGroup && edgesGroup.parentNode) {
        overlayElement.removeChild(edgesGroup)
        cloneElements.delete(`${nodeId}-edges`)
      }
      
      activeNode = null
    }

    // Délégation d'événements sur l'overlay
    function handleMouseOver(e: Event) {
      const me = e as MouseEvent
      console.log('MouseOver triggered:', { target: (e.target as Element)?.tagName })
      
      if (isOverShield(me.clientX, me.clientY)) {
        console.log('Shield detected - blocking interaction')
        return // ➜ ne pas activer le clone
      }

      const target = e.target as Element
      const hitArea = target.closest('.hit-area')
      if (hitArea) {
        const nodeId = hitArea.getAttribute('data-id')
        if (nodeId) {
          console.log('Activating node:', nodeId)
          if (timeoutId) clearTimeout(timeoutId)
          if (activeNode !== nodeId) {
            if (activeNode) removeClone(activeNode)
            createClone(nodeId)
            activeNode = nodeId
          }
        }
      }
    }

    function handleMouseOut(e: Event) {
      const target = e.target as Element
      const hitArea = target.closest('.hit-area')
      if (hitArea && activeNode) {
        // Délai pour éviter le flicker
        timeoutId = window.setTimeout(() => {
          if (activeNode) removeClone(activeNode)
        }, 150)
      }
    }

    function handleFocus(e: Event) {
      const target = e.target as Element
      if (target.classList.contains('hit-area')) {
        const nodeId = target.getAttribute('data-id')
        if (nodeId && activeNode !== nodeId) {
          if (activeNode) removeClone(activeNode)
          createClone(nodeId)
          activeNode = nodeId
        }
      }
    }

    function handleBlur(e: Event) {
      if (activeNode) {
        timeoutId = window.setTimeout(() => {
          if (activeNode) removeClone(activeNode)
        }, 150)
      }
    }

    // Support mobile - tap-to-reveal
    let tapTimeout: number | null = null
    let armedNode: string | null = null

    function handleTouch(e: Event) {
      const te = e as TouchEvent
      const touch = te.changedTouches[0]
      if (isOverShield(touch.clientX, touch.clientY)) return // idem sur mobile

      const target = e.target as Element
      const hitArea = target.closest('.hit-area')
      if (!hitArea) return

      const nodeId = hitArea.getAttribute('data-id')
      if (!nodeId) return

      const link = hitArea.closest('a') as HTMLAnchorElement
      if (!link) return

      e.preventDefault()

      if (armedNode === nodeId) {
        // Deuxième tap - naviguer
        window.location.href = link.href
      } else {
        // Premier tap - révéler
        if (activeNode) removeClone(activeNode)
        createClone(nodeId)
        activeNode = nodeId
        armedNode = nodeId
        
        // Désarmer après 3 secondes
        tapTimeout = window.setTimeout(() => {
          armedNode = null
          if (activeNode) removeClone(activeNode)
        }, 3000)
      }
    }

    function handleKeyPress(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        const target = e.target as Element
        if (target.classList.contains('hit-area')) {
          const link = target.closest('a') as HTMLAnchorElement
          if (link) {
            window.location.href = link.href
          }
        }
      }
    }

    // Écouteurs délégués sur l'overlay
    overlayElement.addEventListener('mouseover', handleMouseOver)
    overlayElement.addEventListener('mouseout', handleMouseOut)
    overlayElement.addEventListener('focusin', handleFocus)
    overlayElement.addEventListener('focusout', handleBlur)
    overlayElement.addEventListener('touchend', handleTouch)
    overlayElement.addEventListener('keypress', handleKeyPress)

    return () => {
      // Nettoyage du portal
      if (overlayContainer.parentNode) {
        document.body.removeChild(overlayContainer)
      }
      window.removeEventListener('resize', updateOverlayPosition)
      window.removeEventListener('scroll', updateOverlayPosition)
      if (timeoutId) clearTimeout(timeoutId)
      if (tapTimeout) clearTimeout(tapTimeout)
    }

  }, [svgContent])

  if (!svgContent) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-pulse text-subtle">Chargement du graphe...</div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Calque A: Fond constellation (pointer-events: none) */}
      <div 
        ref={containerRef}
        className="interactive-graph-background"
        style={{ pointerEvents: 'none' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {/* Calque B sera créé via portal dans useEffect */}
    </div>
  )
}