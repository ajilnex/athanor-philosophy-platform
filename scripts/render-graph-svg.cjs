#!/usr/bin/env node

/* Generate static SVG graph from billets JSON data */
const fs = require('fs')
const path = require('path')

const GRAPH_JSON_PATH = path.join(process.cwd(), 'public', 'graph-billets.json')
const OUTPUT_SVG_PATH = path.join(process.cwd(), 'public', 'graph-billets.svg')

// SVG dimensions - Format rectangulaire ultra-compact
const SVG_WIDTH = 1200
const SVG_HEIGHT = 300  // Format ultra-compact pour coller au header
const MARGIN = 40       // Marge minimale pour plus de compacité

// Palette cohérente avec le site (valeurs HSL de globals.css)
const COLOR_FOREGROUND = 'hsl(220, 15%, 20%)'  // Texte principal
const COLOR_ACCENT = 'hsl(220, 90%, 55%)'      // Accent bleu
const COLOR_SUBTLE = 'hsl(220, 10%, 60%)'      // Texte secondaire
const COLOR_BACKGROUND = 'hsl(220, 10%, 98%)'  // Fond pour halos

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
 * Get node visual size based on degree
 */
function getNodeSize(degree, tiers) {
  const tier = getNodeTier(degree, tiers)
  return tier === 1 ? 8 : tier === 2 ? 6 : 4
}

/**
 * Calculate robust text metrics approximation for collision detection
 */
function addTextMetrics(nodes, tiers) {
  return nodes.map(node => {
    const tier = getNodeTier(node.degree || 0, tiers)
    const fontSize = tier === 1 ? 12 : tier === 2 ? 10 : 8
    const labelText = node.label.length > 25 ? node.label.substring(0, 25) + '…' : node.label
    
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
      nodeSize: getNodeSize(node.degree || 0, tiers)
    }
  })
}

/**
 * Elliptical layout for elegant horizontal composition
 */
function applyEllipticalLayout(nodes) {
  const centerX = SVG_WIDTH / 2
  const centerY = SVG_HEIGHT / 2
  const radiusX = (SVG_WIDTH - 2 * MARGIN) / 2.5  // Ellipse horizontale large
  const radiusY = (SVG_HEIGHT - 2 * MARGIN) / 3   // Plus compacte verticalement
  
  return nodes.map((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI
    // Ajout de variation aléatoire légère pour naturel
    const variation = 0.15
    const radiusVariationX = radiusX * (1 + (Math.random() - 0.5) * variation)
    const radiusVariationY = radiusY * (1 + (Math.random() - 0.5) * variation)
    
    return {
      ...node,
      x: centerX + Math.cos(angle) * radiusVariationX,
      y: centerY + Math.sin(angle) * radiusVariationY
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
        y: targetCenterY + (Math.random() - 0.5) * 50
      }
    }
    
    // Transform persistent positions to SVG coordinates
    const transformedX = targetCenterX + (node.x - sourceCenterX) * scale
    const transformedY = targetCenterY + (node.y - sourceCenterY) * scale
    
    return {
      ...node,
      x: transformedX,
      y: transformedY
    }
  })
}

/**
 * Center the graph on the most central node and apply padding
 */
function centerAndPadGraph(nodes) {
  if (nodes.length === 0) return nodes
  
  // Find the most central node (highest degree)
  const centralNode = nodes.reduce((max, node) => 
    (node.degree || 0) > (max.degree || 0) ? node : max
  )
  
  // Calculate bounds
  const minX = Math.min(...nodes.map(n => n.x))
  const maxX = Math.max(...nodes.map(n => n.x))
  const minY = Math.min(...nodes.map(n => n.y))
  const maxY = Math.max(...nodes.map(n => n.y))
  
  const currentCenterX = (minX + maxX) / 2
  const currentCenterY = (minY + maxY) / 2
  
  // Desired center (bias toward central node but not too extreme)
  const targetCenterX = SVG_WIDTH / 2
  const targetCenterY = SVG_HEIGHT / 2
  
  // Offset to center the graph better
  const offsetX = targetCenterX - currentCenterX
  const offsetY = targetCenterY - currentCenterY
  
  // Apply centering and padding (6% margin)
  const padding = Math.min(SVG_WIDTH, SVG_HEIGHT) * 0.06
  const workingWidth = SVG_WIDTH - 2 * padding
  const workingHeight = SVG_HEIGHT - 2 * padding
  
  return nodes.map(node => ({
    ...node,
    x: padding + ((node.x + offsetX - padding) * workingWidth) / (SVG_WIDTH - 2 * padding),
    y: padding + ((node.y + offsetY - padding) * workingHeight) / (SVG_HEIGHT - 2 * padding)
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
    const cooling = 1 - (iter / iterations) // Refroidissement progressif
    
    // Repulsion forces - plus fortes pour contrôler la densité
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]
        const dx = nodeB.x - nodeA.x
        const dy = nodeB.y - nodeA.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        
        // Répulsion très forte pour aérer davantage
        const repulsion = (1000 / (dist * dist)) * cooling // Forte augmentation de la répulsion
        const fx = (dx / dist) * repulsion
        const fy = (dy / dist) * repulsion * 0.7 // Moins de force verticale
        
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
      
      node.x += (dx / dist) * gravity * 0.6  // Encore moins de gravité horizontale
      node.y += (dy / dist) * gravity * 1.0  // Gravité verticale modérée
    })
    
    // Keep nodes in bounds with padding
    nodes.forEach(node => {
      node.x = Math.max(MARGIN, Math.min(SVG_WIDTH - MARGIN, node.x))
      node.y = Math.max(MARGIN, Math.min(SVG_HEIGHT - MARGIN, node.y))
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
          height: nodeA.labelHeight
        }
        
        const boxB = {
          x: nodeB.x - nodeB.labelWidth / 2,
          y: nodeB.y + nodeB.nodeSize + 4,
          width: nodeB.labelWidth,
          height: nodeB.labelHeight
        }
        
        // Vérifier collision
        const overlapX = Math.max(0, Math.min(boxA.x + boxA.width, boxB.x + boxB.width) - Math.max(boxA.x, boxB.x))
        const overlapY = Math.max(0, Math.min(boxA.y + boxA.height, boxB.y + boxB.height) - Math.max(boxA.y, boxB.y))
        
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
          
          // Garder dans les limites
          nodeA.x = Math.max(MARGIN, Math.min(SVG_WIDTH - MARGIN, nodeA.x))
          nodeA.y = Math.max(MARGIN, Math.min(SVG_HEIGHT - MARGIN, nodeA.y))
          nodeB.x = Math.max(MARGIN, Math.min(SVG_WIDTH - MARGIN, nodeB.x))
          nodeB.y = Math.max(MARGIN, Math.min(SVG_HEIGHT - MARGIN, nodeB.y))
        }
      }
    }
    
    // Arrêt anticipé si plus de collisions
    if (!hasCollisions) {
      console.log(`   ✅ Collisions résolues en ${iter + 1} itérations`)
      break
    }
  }
  
  return nodes
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
  
  return distX < (textWidthA + textWidthB + padding) && distY < (fontSize + padding)
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
function generateSVG(nodes, edges, tiers) {
  // Anti-collision: determine which nodes get visible labels
  const nodesWithVisibleLabels = filterLabelsAntiCollision(nodes, tiers)
  
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
      
      // Filter T3↔T3 connections to reduce noise
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
      
      const strokeWidth = edge.bidirectional ? 1.5 : 1
      
      // Higher opacity if at least one endpoint is T1, lower otherwise
      const opacity = (sourceTier === 1 || targetTier === 1) ? 0.8 : 0.4
      
      return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" 
                    stroke="${COLOR_SUBTLE}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`
    }).join('\n')
  
  // Generate nodes with sophisticated group structure
  const nodesSVG = nodes.map(node => {
    const tier = getNodeTier(node.degree || 0, tiers)
    
    const radius = tier === 1 ? 8 : tier === 2 ? 6 : 4
    const color = tier === 1 ? COLOR_ACCENT : tier === 2 ? COLOR_FOREGROUND : COLOR_SUBTLE
    const textSize = tier === 1 ? 12 : tier === 2 ? 10 : 8
    
    const isClickable = tier <= 2
    const labelText = node.label.length > 25 ? node.label.substring(0, 25) + '…' : node.label
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
    
    // Labels avec gestion intelligente
    let text = ''
    if (hasVisibleLabel) {
      text = `<text x="${node.x}" y="${node.y + radius + textSize + 6}" 
                    text-anchor="middle" 
                    font-size="${textSize}" 
                    font-family="IBM Plex Serif, serif" 
                    fill="${COLOR_FOREGROUND}"
                    class="node-label node-label-visible"
                    paint-order="stroke" 
                    stroke="${COLOR_BACKGROUND}" 
                    stroke-width="3px">
                    ${escapeXML(labelText)}
                  </text>`
    } else if (isT2HoverLabel) {
      text = `<text x="${node.x}" y="${node.y + radius + textSize + 6}" 
                    text-anchor="middle" 
                    font-size="${textSize}" 
                    font-family="IBM Plex Serif, serif" 
                    fill="${COLOR_FOREGROUND}"
                    class="node-label node-label-hover"
                    paint-order="stroke" 
                    stroke="${COLOR_BACKGROUND}" 
                    stroke-width="3px"
                    opacity="0">
                    ${escapeXML(labelText)}
                  </text>`
    }
    
    if (isClickable) {
      return `<a href="${node.url}" class="graph-link">
                <g class="node-group tier-${tier}" data-degree="${node.degree || 0}">
                  <title>${escapeXML(node.label)} (${node.degree || 0} connexions)</title>
                  ${tapArea}
                  ${halo}
                  ${circle}
                  ${text}
                </g>
              </a>`
    } else {
      return `<g class="node-group-static tier-${tier}">
                <title>${escapeXML(node.label)}</title>
                ${circle}
                ${text}
              </g>`
    }
  }).join('\n')
  
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
    
    // Filter nodes (keep top nodes and some connected ones) and add text metrics
    let filteredNodes = graphData.nodes
      .filter(node => (node.degree || 0) >= 1) // Only keep connected nodes
      .slice(0, 30) // Limit to 30 nodes for readability
    
    // Add precise text metrics for collision detection
    filteredNodes = addTextMetrics(filteredNodes, tiers)
    
    // Filter edges to only include those between filtered nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredEdges = graphData.edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    )
    
    console.log(`   🎯 Filtré: ${filteredNodes.length} nœuds, ${filteredEdges.length} arêtes`)
    
    // Apply controlled elliptical layout with collision resolution (forme élégante horizontale)
    filteredNodes = applyEllipticalLayout(filteredNodes)
    filteredNodes = applyForceLayout(filteredNodes, filteredEdges, 200)
    filteredNodes = applyCollisionResolution(filteredNodes) // Chorégraphie
    filteredNodes = centerAndPadGraph(filteredNodes) // Centrage pondéré final
    
    // Generate SVG
    const svgContent = generateSVG(filteredNodes, filteredEdges, tiers)
    
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