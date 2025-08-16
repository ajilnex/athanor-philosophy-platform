#!/usr/bin/env node

/* Generate static SVG graph from billets JSON data */
const fs = require('fs')
const path = require('path')

const GRAPH_JSON_PATH = path.join(process.cwd(), 'public', 'graph-billets.json')
const OUTPUT_SVG_PATH = path.join(process.cwd(), 'public', 'graph-billets.svg')

// SVG dimensions - Plein écran dynamique
const SVG_WIDTH = 1440 // Ratio desktop standard
const SVG_HEIGHT = 820 // Format plein écran pour constellation
const VIEWPORT_MARGIN = 0.08 // 8% de marge pour bbox scaling

// Palette cohérente avec le site (valeurs HSL de globals.css)
const COLOR_FOREGROUND = 'hsl(220, 15%, 20%)' // Texte principal
const COLOR_ACCENT = 'hsl(220, 90%, 55%)' // Accent bleu
const COLOR_SUBTLE = 'hsl(220, 10%, 60%)' // Texte secondaire
const COLOR_BACKGROUND = 'hsl(220, 10%, 98%)' // Fond pour halos

/**
 * Calculate percentiles for node degrees to create tiers
 */
function calculateTiers(nodes) {
  const degrees = nodes.map(n => n.degree || 0).sort((a, b) => b - a)

  if (degrees.length === 0) return { tier1: 0, tier2: 0, tier3: 0 }

  const p90 = degrees[Math.floor(degrees.length * 0.1)] || 0
  const p70 = degrees[Math.floor(degrees.length * 0.3)] || 0

  return { tier1: p90, tier2: p70, tier3: 0 }
}

/**
 * Assign node to tier based on degree
 */
function getNodeTier(degree, tiers) {
  if (degree >= tiers.tier1) return 1
  if (degree >= tiers.tier2) return 2
  return 3
}

/**
 * Get node visual size based on degree (v2 scaling)
 */
function getNodeSize(degree, tiers) {
  const tier = getNodeTier(degree, tiers)
  return tier === 1 ? 11 : tier === 2 ? 7 : 4
}

/**
 * Calculate robust text metrics approximation for collision detection
 */
function addTextMetrics(nodes, tiers) {
  return nodes.map(node => {
    const tier = getNodeTier(node.degree || 0, tiers)
    const fontSize = tier === 1 ? 14 : tier === 2 ? 11 : 8
    const MAX_LABEL_LENGTH = 25
    let labelText = node.label
    if (labelText.length > MAX_LABEL_LENGTH) {
      labelText = labelText.substring(0, MAX_LABEL_LENGTH - 1) + '…'
    }

    // Approximation robuste basée sur les caractéristiques d'IBM Plex Serif
    // Facteur d'ajustement pour serif fonts (plus larges que sans-serif)
    const serifFactor = 0.65
    const labelWidth = labelText.length * fontSize * serifFactor
    const labelHeight = fontSize * 1.2 // Height avec descenders

    return {
      ...node,
      labelWidth,
      labelHeight,
      labelText,
      fontSize,
      nodeSize: getNodeSize(node.degree || 0, tiers),
    }
  })
}

/**
 * Golden angle pivots for stable constellation
 */
function applyGoldenAnglePivots(nodes) {
  const centerX = SVG_WIDTH / 2
  const centerY = SVG_HEIGHT / 2
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)) // ~137.5°

  // Amplitude augmentée +35% pour plein écran
  const radiusX = SVG_WIDTH * 0.35 // 35% du viewport width
  const radiusY = SVG_HEIGHT * 0.32 // 32% du viewport height

  return nodes.map((node, i) => {
    // Pivots déterministes avec golden angle
    const angle = i * goldenAngle
    const radius = Math.sqrt(i / nodes.length) // Distribution radiale uniforme

    return {
      ...node,
      x: centerX + Math.cos(angle) * radiusX * radius,
      y: centerY + Math.sin(angle) * radiusY * radius,
    }
  })
}

/**
 * Apply persistent positions from JSON with proper scaling and centering for SVG viewport
 */
function applyPersistentPositions(nodes) {
  if (nodes.length === 0) return nodes

  // Find bounds of existing positions
  const positions = nodes.filter(n => n.x !== undefined && n.y !== undefined)
  if (positions.length === 0) {
    // Fallback to elliptical layout if no positions
    return applyEllipticalLayout(nodes)
  }

  const minX = Math.min(...positions.map(n => n.x))
  const maxX = Math.max(...positions.map(n => n.x))
  const minY = Math.min(...positions.map(n => n.y))
  const maxY = Math.max(...positions.map(n => n.y))

  const sourceWidth = maxX - minX
  const sourceHeight = maxY - minY

  // SVG working area with margins
  const margin = 60
  const targetWidth = SVG_WIDTH - 2 * margin
  const targetHeight = SVG_HEIGHT - 2 * margin
  const targetCenterX = SVG_WIDTH / 2
  const targetCenterY = SVG_HEIGHT / 2

  // Calculate scaling to fit within viewport while preserving aspect ratio
  const scaleX = sourceWidth > 0 ? targetWidth / sourceWidth : 1
  const scaleY = sourceHeight > 0 ? targetHeight / sourceHeight : 1
  const scale = Math.min(scaleX, scaleY, 1.2) // Limit maximum scale

  // Center of source coordinates
  const sourceCenterX = (minX + maxX) / 2
  const sourceCenterY = (minY + maxY) / 2

  return nodes.map(node => {
    if (node.x === undefined || node.y === undefined) {
      // Fallback position for nodes without coordinates
      return {
        ...node,
        x: targetCenterX + (Math.random() - 0.5) * 100,
        y: targetCenterY + (Math.random() - 0.5) * 50,
      }
    }

    // Transform persistent positions to SVG coordinates
    const transformedX = targetCenterX + (node.x - sourceCenterX) * scale
    const transformedY = targetCenterY + (node.y - sourceCenterY) * scale

    return {
      ...node,
      x: transformedX,
      y: transformedY,
    }
  })
}

/**
 * Bbox scaling to fill 90-92% of viewport
 */
function applyBboxScaling(nodes) {
  if (nodes.length === 0) return nodes

  // Calculate current bounding box
  const minX = Math.min(...nodes.map(n => n.x))
  const maxX = Math.max(...nodes.map(n => n.x))
  const minY = Math.min(...nodes.map(n => n.y))
  const maxY = Math.max(...nodes.map(n => n.y))

  const currentWidth = maxX - minX
  const currentHeight = maxY - minY
  const currentCenterX = (minX + maxX) / 2
  const currentCenterY = (minY + maxY) / 2

  // Target dimensions: 90-92% of viewport with margin
  const targetMargin = SVG_WIDTH * VIEWPORT_MARGIN
  const targetWidth = SVG_WIDTH - 2 * targetMargin
  const targetHeight = SVG_HEIGHT - 2 * targetMargin
  const targetCenterX = SVG_WIDTH / 2
  const targetCenterY = SVG_HEIGHT / 2

  // Calculate scaling factors
  const scaleX = currentWidth > 0 ? targetWidth / currentWidth : 1
  const scaleY = currentHeight > 0 ? targetHeight / currentHeight : 1
  const scale = Math.min(scaleX, scaleY) * 0.91 // 91% fill factor

  return nodes.map(node => ({
    ...node,
    x: targetCenterX + (node.x - currentCenterX) * scale,
    y: targetCenterY + (node.y - currentCenterY) * scale,
  }))
}

/**
 * Apply controlled force-directed adjustment for dense horizontal composition
 */
function applyForceLayout(nodes, edges, iterations = 200) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const centerX = SVG_WIDTH / 2
  const centerY = SVG_HEIGHT / 2

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations // Refroidissement progressif

    // Repulsion forces - plus fortes pour contrôler la densité
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        // Répulsion contrôlée pour constellation plein écran
        const repulsion = (1800 / (dist * dist)) * cooling // Répulsion ajustée plein écran
        const fx = (dx / dist) * repulsion
        const fy = (dy / dist) * repulsion * 0.8 // Moins de force verticale

        nodeA.x -= fx
        nodeA.y -= fy
        nodeB.x += fx
        nodeB.y += fy
      }
    }

    // Attraction forces (edges) - plus contrôlées
    edges.forEach(edge => {
      const nodeA = nodeMap.get(edge.source)
      const nodeB = nodeMap.get(edge.target)

      if (nodeA && nodeB) {
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        const attraction = dist * 0.012 * cooling
        const fx = (dx / dist) * attraction
        const fy = (dy / dist) * attraction * 0.8 // Attraction verticale réduite

        nodeA.x += fx
        nodeA.y += fy
        nodeB.x -= fx
        nodeB.y -= fy
      }
    })

    // Gravité différenciée pour maintenir l'ellipse
    nodes.forEach(node => {
      const dx = centerX - node.x
      const dy = centerY - node.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const gravity = 0.02 * cooling // Gravité réduite pour laisser plus d'espace

      node.x += (dx / dist) * gravity * 0.6 // Encore moins de gravité horizontale
      node.y += (dy / dist) * gravity * 1.0 // Gravité verticale modérée
    })

    // Keep nodes in bounds with viewport margin
    const margin = SVG_WIDTH * VIEWPORT_MARGIN
    nodes.forEach(node => {
      node.x = Math.max(margin, Math.min(SVG_WIDTH - margin, node.x))
      node.y = Math.max(margin, Math.min(SVG_HEIGHT - margin, node.y))
    })
  }

  return nodes
}

/**
 * Apply collision resolution to prevent label overlap
 * This is the "choreography" layer that ensures perfect readability
 */
function applyCollisionResolution(nodes, iterations = 50, padding = 20) {
  console.log('   🎭 Résolution des collisions de labels...')

  // Phase 1: Try to resolve collisions by moving nodes
  for (let iter = 0; iter < iterations; iter++) {
    let hasCollisions = false

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]

        // Calculer les bounding boxes des labels
        const boxA = {
          x: nodeA.x - nodeA.labelWidth / 2,
          y: nodeA.y + nodeA.nodeSize + 4, // Position du label sous le nœud
          width: nodeA.labelWidth,
          height: nodeA.labelHeight,
        }

        const boxB = {
          x: nodeB.x - nodeB.labelWidth / 2,
          y: nodeB.y + nodeB.nodeSize + 4,
          width: nodeB.labelWidth,
          height: nodeB.labelHeight,
        }

        // Vérifier collision
        const overlapX = Math.max(
          0,
          Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - Math.max(boxA.x, boxB.x)
        )
        const overlapY = Math.max(
          0,
          Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - Math.max(boxA.y, boxB.y)
        )

        if (overlapX > 0 && overlapY > 0) {
          hasCollisions = true

          // Calculer direction de séparation
          const centerAx = boxA.x + boxA.width / 2
          const centerAy = boxA.y + boxA.height / 2
          const centerBx = boxB.x + boxB.width / 2
          const centerBy = boxB.y + boxB.height / 2

          const dx = centerBx - centerAx
          const dy = centerBy - centerAy
          const distance = Math.sqrt(dx * dx + dy * dy) || 1

          // Force de séparation proportionnelle au chevauchement
          const separation = Math.max(overlapX, overlapY) + padding
          const force = separation * 0.5 // Force de poussée

          const fx = (dx / distance) * force
          const fy = (dy / distance) * force

          // Pousser les nœuds dans des directions opposées
          nodeA.x -= fx * 0.5
          nodeA.y -= fy * 0.5
          nodeB.x += fx * 0.5
          nodeB.y += fy * 0.5

          // Garder dans les limites du viewport
          const margin = SVG_WIDTH * VIEWPORT_MARGIN
          nodeA.x = Math.max(margin, Math.min(SVG_WIDTH - margin, nodeA.x))
          nodeA.y = Math.max(margin, Math.min(SVG_HEIGHT - margin, nodeA.y))
          nodeB.x = Math.max(margin, Math.min(SVG_WIDTH - margin, nodeB.x))
          nodeB.y = Math.max(margin, Math.min(SVG_HEIGHT - margin, nodeB.y))
        }
      }
    }

    // Arrêt anticipé si plus de collisions
    if (!hasCollisions) {
      console.log(`   ✅ Collisions résolues en ${iter + 1} itérations`)
      break
    }
  }

  // Phase 2: Intelligent pruning - hide labels that still collide
  const visibleLabels = new Set(nodes.map(n => n.id))

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i]
      const nodeB = nodes[j]

      // Check if labels still overlap after movement
      const boxA = {
        x: nodeA.x - nodeA.labelWidth / 2,
        y: nodeA.y + nodeA.nodeSize + 4,
        width: nodeA.labelWidth,
        height: nodeA.labelHeight,
      }

      const boxB = {
        x: nodeB.x - nodeB.labelWidth / 2,
        y: nodeB.y + nodeB.nodeSize + 4,
        width: nodeB.labelWidth,
        height: nodeB.labelHeight,
      }

      const overlapX = Math.max(
        0,
        Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - Math.max(boxA.x, boxB.x)
      )
      const overlapY = Math.max(
        0,
        Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - Math.max(boxA.y, boxB.y)
      )

      if (overlapX > 0 && overlapY > 0) {
        // Hide label of less important node (lower degree)
        if ((nodeA.degree || 0) < (nodeB.degree || 0)) {
          visibleLabels.delete(nodeA.id)
        } else {
          visibleLabels.delete(nodeB.id)
        }
      }
    }
  }

  return { finalNodes: nodes, visibleLabels }
}

/**
 * Escape XML special characters
 */
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Check if two text labels would collide (simple bbox approximation)
 */
function labelsCollide(nodeA, nodeB, fontSize = 12) {
  const padding = fontSize * 0.5
  const textWidthA = (nodeA.label.length * fontSize * 0.6) / 2 // Approximation
  const textWidthB = (nodeB.label.length * fontSize * 0.6) / 2

  const distX = Math.abs(nodeA.x - nodeB.x)
  const distY = Math.abs(nodeA.y - nodeB.y)

  return distX < textWidthA + textWidthB + padding && distY < fontSize + padding
}

/**
 * Filter labels to prevent collision (keep most important nodes)
 */
function filterLabelsAntiCollision(nodes, tiers) {
  const nodesWithLabels = []

  // Sort by importance (tier, then degree)
  const sortedNodes = [...nodes].sort((a, b) => {
    const tierA = getNodeTier(a.degree || 0, tiers)
    const tierB = getNodeTier(b.degree || 0, tiers)
    if (tierA !== tierB) return tierA - tierB
    return (b.degree || 0) - (a.degree || 0)
  })

  sortedNodes.forEach(node => {
    const tier = getNodeTier(node.degree || 0, tiers)

    // T1 always gets labels, T2 only if no collision with existing labels
    if (tier === 1 || (tier === 2 && !nodesWithLabels.some(n => labelsCollide(node, n)))) {
      nodesWithLabels.push(node)
    }
  })

  return new Set(nodesWithLabels.map(n => n.id))
}

/**
 * Generate SVG content
 */
function generateSVG(nodes, edges, tiers, visibleLabels = null) {
  // Use provided visibleLabels or fallback to anti-collision filter
  const nodesWithVisibleLabels = visibleLabels || filterLabelsAntiCollision(nodes, tiers)

  const defs = `
    <defs>
      <!-- Effet glow sophistiqué pour les survols -->
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <!-- Ombre subtile pour la profondeur -->
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="1" stdDeviation="2" flood-opacity="0.15"/>
      </filter>
    </defs>`

  // Detect bidirectional edges for thickness
  const edgeMap = new Map()
  edges.forEach(edge => {
    const key = `${edge.source}↔${edge.target}`
    const reverseKey = `${edge.target}↔${edge.source}`
    if (edgeMap.has(reverseKey)) {
      edgeMap.set(reverseKey, { ...edgeMap.get(reverseKey), bidirectional: true })
    } else {
      edgeMap.set(key, { ...edge, bidirectional: false })
    }
  })

  // Generate edges with smart filtering and thickness
  const edgesSVG = Array.from(edgeMap.values())
    .filter(edge => {
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      if (!source || !target) return false

      // Filter T3↔T3 connections to reduce visual noise
      const sourceTier = getNodeTier(source.degree || 0, tiers)
      const targetTier = getNodeTier(target.degree || 0, tiers)
      if (sourceTier === 3 && targetTier === 3) return false

      return true
    })
    .map(edge => {
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      const sourceTier = getNodeTier(source.degree || 0, tiers)
      const targetTier = getNodeTier(target.degree || 0, tiers)

      const strokeWidth = edge.bidirectional
        ? 1.8
        : sourceTier === 1 || targetTier === 1
          ? 1.6
          : 1.0

      // Budget opacité global: fond très discret
      const opacity = sourceTier === 1 || targetTier === 1 ? 0.15 : 0.1

      return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" 
                    stroke="${COLOR_SUBTLE}" stroke-width="${strokeWidth}" opacity="${opacity}"
                    class="edge" data-source="${edge.source}" data-target="${edge.target}"/>`
    })
    .join('\n')

  // Generate nodes with sophisticated group structure
  const nodesSVG = nodes
    .map(node => {
      const tier = getNodeTier(node.degree || 0, tiers)

      const radius = tier === 1 ? 8 : tier === 2 ? 6 : 4
      const color = tier === 1 ? COLOR_ACCENT : tier === 2 ? COLOR_FOREGROUND : COLOR_SUBTLE
      const textSize = tier === 1 ? 12 : tier === 2 ? 10 : 8

      const isClickable = tier <= 2
      const MAX_LABEL_LENGTH = 25
      let labelText = node.label
      if (labelText.length > MAX_LABEL_LENGTH) {
        labelText = labelText.substring(0, MAX_LABEL_LENGTH - 1) + '…'
      }
      const hasVisibleLabel = nodesWithVisibleLabels.has(node.id)
      const isT2HoverLabel = tier === 2 && !hasVisibleLabel

      // Halo pour effet glow (invisible par défaut)
      const halo = `<circle cx="${node.x}" cy="${node.y}" r="${radius + 6}" 
                          fill="${color}" 
                          class="node-halo" 
                          opacity="0" 
                          filter="url(#glow)"/>`

      // Nœud principal
      const circle = `<circle cx="${node.x}" cy="${node.y}" r="${radius}" 
                           fill="${color}" 
                           filter="url(#shadow)" 
                           stroke="${COLOR_BACKGROUND}" 
                           stroke-width="1.5"
                           class="node-main"/>`

      // Zone tactile élargie invisible
      const tapArea = `<circle cx="${node.x}" cy="${node.y}" r="${radius + 12}" 
                            fill="transparent" 
                            class="tap-area"/>`

      // Règles d'apparition: T1 visible, T2 survol, T3 jamais
      let text = ''
      if (tier === 1) {
        // T1: toujours visible avec halo renforcé
        text = `<text x="${node.x}" y="${node.y + radius + textSize + 8}" 
                    text-anchor="middle" 
                    font-size="${textSize}" 
                    font-family="IBM Plex Serif, serif" 
                    fill="${COLOR_FOREGROUND}"
                    class="node-label node-label-t1"
                    paint-order="stroke" 
                    stroke="${COLOR_BACKGROUND}" 
                    stroke-width="4px">
                    ${escapeXML(labelText)}
                  </text>`
      } else if (tier === 2) {
        // T2: au survol seulement
        text = `<text x="${node.x}" y="${node.y + radius + textSize + 6}" 
                    text-anchor="middle" 
                    font-size="${textSize}" 
                    font-family="IBM Plex Serif, serif" 
                    fill="${COLOR_FOREGROUND}"
                    class="node-label node-label-t2"
                    paint-order="stroke" 
                    stroke="${COLOR_BACKGROUND}" 
                    stroke-width="3px"
                    opacity="0">
                    ${escapeXML(labelText)}
                  </text>`
      }
      // T3: pas de label (text reste vide)

      // Seuls T1 et T2 sont cliquables, T3 reste statique
      if (tier <= 2) {
        return `<a href="${node.url}" class="graph-link" data-node-id="${node.id}">
                <g class="node-group tier-${tier}" data-degree="${node.degree || 0}" data-id="${node.id}">
                  <title>${escapeXML(node.label)} (${node.degree || 0} connexions)</title>
                  <!-- Zone de hit pour deux-calques système -->
                  <circle cx="${node.x}" cy="${node.y}" r="${radius + 15}" 
                          fill="transparent" class="node-hit" 
                          data-id="${node.id}" tabindex="0"
                          aria-label="${escapeXML(node.label)}"/>
                  ${halo}
                  ${circle}
                  ${text}
                </g>
              </a>`
      } else {
        return `<g class="node-group-static tier-${tier}" data-id="${node.id}">
                <title>${escapeXML(node.label)}</title>
                ${circle}
                <!-- T3: pas de label -->
              </g>`
      }
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" 
     xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     style="max-width: 100%; height: auto; background-color: transparent;">
  
  ${defs}
  
  <style>
    /* === CONSTELLATION SOPHISTIQUÉE === */
    
    /* Groupes de nœuds - transition harmonieuse */
    .node-group { 
      transition: opacity 0.3s ease-in-out;
      cursor: pointer;
    }
    
    .graph-link {
      text-decoration: none;
    }
    
    /* Effet global au survol : estomper les autres */
    svg:hover .node-group:not(:hover) { 
      opacity: 0.7; 
    }
    
    /* Nœud survolé : révélation lumineuse */
    .node-group:hover .node-halo { 
      opacity: 0.8 !important; 
      transition: opacity 0.2s ease-in-out;
    }
    
    .node-group:hover .node-main {
      transform: scale(1.15);
      transform-origin: center;
      transition: transform 0.2s ease-in-out;
    }
    
    /* Labels intelligents */
    .node-label { 
      pointer-events: none;
      transition: opacity 0.2s ease-in-out, font-weight 0.2s ease-in-out;
    }
    
    /* Révéler labels T2 au survol */
    .node-group:hover .node-label-hover { 
      opacity: 1 !important; 
    }
    
    /* Amplifier labels visibles au survol */
    .node-group:hover .node-label-visible,
    .node-group:hover .node-label-hover { 
      font-weight: 600;
      stroke-width: 4px;
    }
    
    /* Nœuds statiques T3 - subtils */
    .node-group-static { 
      opacity: 0.8; 
    }
    
    .node-group-static:hover { 
      opacity: 0.9;
    }
    
    /* Zone tactile invisible mais fonctionnelle */
    .tap-area {
      pointer-events: all;
    }
    
    /* Transitions fluides pour tous les éléments */
    circle, text {
      transition: all 0.2s ease-in-out;
    }
    
    /* Optimisation mobile */
    @media (pointer: coarse) {
      .node-group:hover .node-main {
        transform: scale(1.3);
      }
    }
  </style>
  
  <!-- Pas de background - transparent pour s'intégrer au dégradé de la page -->
  
  <!-- Edges -->
  <g class="edges">
    ${edgesSVG}
  </g>
  
  <!-- Nodes -->
  <g class="nodes">
    ${nodesSVG}
  </g>
  
</svg>`
}

async function main() {
  console.log('🎨 Génération du graphe SVG...')

  try {
    // Read graph data
    const graphData = JSON.parse(fs.readFileSync(GRAPH_JSON_PATH, 'utf8'))
    console.log(`   📊 ${graphData.nodes.length} nœuds, ${graphData.edges.length} arêtes`)

    // Calculate tiers
    const tiers = calculateTiers(graphData.nodes)
    console.log(`   🎯 Tiers: T1≥${tiers.tier1}, T2≥${tiers.tier2}, T3≥${tiers.tier3}`)

    // Filter nodes (keep connected and interesting nodes) and add text metrics
    let filteredNodes = graphData.nodes
      .filter(node => (node.degree || 0) >= 1) // Only keep connected nodes
      .slice(0, 18) // Limit to 18 nodes for cleaner constellation

    // Add precise text metrics for collision detection
    filteredNodes = addTextMetrics(filteredNodes, tiers)

    // Filter edges to only include those between filtered nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredEdges = graphData.edges.filter(
      edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    )

    console.log(`   🎯 Filtré: ${filteredNodes.length} nœuds, ${filteredEdges.length} arêtes`)

    // Apply golden angle constellation with bbox scaling
    filteredNodes = applyGoldenAnglePivots(filteredNodes)
    filteredNodes = applyForceLayout(filteredNodes, filteredEdges, 180) // Force layout léger pour décoller amas
    const { finalNodes, visibleLabels } = applyCollisionResolution(filteredNodes, 60, 25)
    filteredNodes = applyBboxScaling(finalNodes) // Bbox scaling 90-92% viewport

    // Generate SVG
    const svgContent = generateSVG(filteredNodes, filteredEdges, tiers, visibleLabels)

    // Write to file
    fs.writeFileSync(OUTPUT_SVG_PATH, svgContent, 'utf8')

    console.log(`✅ SVG généré: ${OUTPUT_SVG_PATH}`)
    console.log(`   🎨 ${filteredNodes.length} nœuds rendus`)

    // Count clickable nodes
    const clickableNodes = filteredNodes.filter(n => getNodeTier(n.degree || 0, tiers) <= 2)
    console.log(`   🖱️  ${clickableNodes.length} nœuds cliquables`)
  } catch (error) {
    console.error('❌ Erreur lors de la génération SVG:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
