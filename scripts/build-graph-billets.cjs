#!/usr/bin/env node

/* Build un graphe billets-only en JSON (noeuds = billets, edges = liens) avec positions persistantes */
const fs = require('fs/promises')
const path = require('path')
const matter = require('gray-matter')
const crypto = require('crypto')

const BILLETS_DIR = path.join(process.cwd(), 'content', 'billets')
const TRASH_DIR = path.join(process.cwd(), 'content', 'trash')
const OUT_PATH = path.join(process.cwd(), 'public', 'graph-billets.json')
const PIVOTS_PATH = path.join(process.cwd(), 'data', 'graph-pivots.json')
const POSITIONS_PATH = path.join(process.cwd(), 'public', 'graph-positions.json')

/** @typedef {{ id:string, label:string, url:string, degree?:number, x?:number, y?:number }} Node */
/** @typedef {{ id:string, source:string, target:string }} Edge */

// Utilitaires pour la stabilité du graphe
async function loadPivots() {
  try {
    const data = await fs.readFile(PIVOTS_PATH, 'utf8')
    const pivots = JSON.parse(data)
    return new Set(pivots.pivots || [])
  } catch (e) {
    console.log('   ⚠️  Pivots non trouvés, tous les nœuds seront mobiles')
    return new Set()
  }
}

async function loadPositions() {
  try {
    const data = await fs.readFile(POSITIONS_PATH, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    console.log('   📍 Aucune position persistante trouvée, génération initiale')
    return {}
  }
}

function generateDeterministicPosition(nodeId, existingPositions) {
  // Seed déterministe basé sur le hash du nodeId
  const hash = crypto.createHash('md5').update(nodeId).digest('hex')
  const seed = parseInt(hash.substr(0, 8), 16)
  
  // Générateur pseudo-aléatoire simple et déterministe
  let rng = seed
  const random = () => {
    rng = (rng * 1664525 + 1013904223) % (2**32)
    return rng / (2**32)
  }
  
  // Placement en anneaux concentriques pour éviter le clustering
  const angle = random() * 2 * Math.PI
  const ring = Math.floor(random() * 3) // 3 anneaux
  const radius = 100 + ring * 80 // Rayons 100, 180, 260
  
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  }
}

function applyStabilizedLayout(nodes, pivots, existingPositions) {
  const positions = { ...existingPositions }
  let pivotLocked = 0
  let newNodes = 0
  let totalMovement = 0
  
  // 1. Verrouiller les positions des pivots existants
  for (const node of nodes) {
    if (pivots.has(node.id) && positions[node.id]) {
      node.x = positions[node.id].x
      node.y = positions[node.id].y
      pivotLocked++
    } else if (positions[node.id]) {
      // Nœud existant non-pivot : position actuelle + légère relaxation
      node.x = positions[node.id].x
      node.y = positions[node.id].y
    } else {
      // Nouveau nœud : position déterministe
      const pos = generateDeterministicPosition(node.id, positions)
      node.x = pos.x
      node.y = pos.y
      newNodes++
    }
    
    // Sauvegarder la nouvelle position
    if (!positions[node.id]) {
      positions[node.id] = { x: node.x, y: node.y }
    } else {
      const oldPos = positions[node.id]
      const movement = Math.sqrt((node.x - oldPos.x)**2 + (node.y - oldPos.y)**2)
      if (!pivots.has(node.id)) {
        totalMovement += movement
      }
      positions[node.id] = { x: node.x, y: node.y }
    }
  }
  
  return {
    positions,
    stats: {
      pivotLocked,
      newNodes,
      avgMovement: totalMovement / Math.max(1, nodes.length - pivotLocked - newNodes)
    }
  }
}

// Charger la liste des billets supprimés (dans trash)
async function loadTrashedSlugs() {
  try {
    const trashFiles = (await fs.readdir(TRASH_DIR)).filter(f => f.endsWith('.mdx'))
    const trashedSlugs = new Set()
    
    // Pour chaque fichier trash, extraire tous les slugs possibles
    for (const file of trashFiles) {
      const fullSlug = file.replace(/\.mdx$/, '')
      trashedSlugs.add(fullSlug)
      
      // Extraire aussi le titre/slug sans date si c'est un format daté
      const withoutDate = fullSlug.replace(/^\d{4}-\d{2}-\d{2}-/, '')
      if (withoutDate !== fullSlug) {
        trashedSlugs.add(withoutDate)
      }
    }
    
    console.log(`   🗑️  Billets trash détectés: ${Array.from(trashedSlugs).join(', ')}`)
    return trashedSlugs
  } catch (e) {
    console.log('   📄 Aucun billet supprimé trouvé dans trash')
    return new Set()
  }
}

async function main() {
  console.log('🔗 Construction du graphe des billets...')
  
  // Charger les données de stabilité
  const pivots = await loadPivots()
  const existingPositions = await loadPositions()
  const trashedSlugs = await loadTrashedSlugs()
  
  const nodes = new Map() /** @type {Map<string, Node>} */
  const edges = new Set() /** @type {Set<string>} */
  const edgeList = []     /** @type {Edge[]} */

  // 1) Lire tous les billets .mdx
  let files
  try {
    files = (await fs.readdir(BILLETS_DIR)).filter(f => f.endsWith('.mdx'))
    console.log(`   Trouvé ${files.length} fichiers .mdx`)
  } catch (e) {
    console.error('❌ Dossier billets introuvable :', BILLETS_DIR)
    throw e
  }

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '')
    const raw = await fs.readFile(path.join(BILLETS_DIR, file), 'utf8')
    const { content, data } = matter(raw)

    // Skip si sealed: true
    if (data.sealed === true) {
      console.log(`   🔒 Billet scellé ignoré: ${file}`)
      continue
    }

    const me = `billet:${slug}`
    if (!nodes.has(me)) {
      nodes.set(me, { 
        id: me, 
        label: data.title || slug, 
        url: `/billets/${slug}` 
      })
    }

    // a) Wikilinks [[slug]] - Exclure les billets supprimés
    const wikiMatches = [...content.matchAll(/\[\[([^\]]+)\]\]/g)]
    for (const m of wikiMatches) {
      const targetSlug = m[1].trim()
      if (!targetSlug || trashedSlugs.has(targetSlug)) continue
      const to = `billet:${targetSlug}`
      if (!nodes.has(to)) {
        nodes.set(to, { 
          id: to, 
          label: targetSlug, 
          url: `/billets/${targetSlug}` 
        })
      }
      const edgeKey = `${me}→${to}`
      if (!edges.has(edgeKey)) {
        edges.add(edgeKey)
        edgeList.push({ 
          id: edgeKey, 
          source: me, 
          target: to 
        })
      }
    }

    // b) Liens markdown internes → /billets/target - Exclure les billets supprimés
    const mdMatches = [...content.matchAll(/\]\(\/billets\/([^)#?\s/]+)\)/g)]
    for (const m of mdMatches) {
      const targetSlug = m[1].trim()
      if (!targetSlug || trashedSlugs.has(targetSlug)) continue
      const to = `billet:${targetSlug}`
      if (!nodes.has(to)) {
        nodes.set(to, { 
          id: to, 
          label: targetSlug, 
          url: `/billets/${targetSlug}` 
        })
      }
      const edgeKey = `${me}→${to}`
      if (!edges.has(edgeKey)) {
        edges.add(edgeKey)
        edgeList.push({ 
          id: edgeKey, 
          source: me, 
          target: to 
        })
      }
    }
  }

  // 2) Calculer les degrés (nombre de connexions par nœud)
  const degree = new Map()
  for (const e of edgeList) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1)
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1)
  }
  
  // Mettre à jour les nœuds avec leur degré
  for (const [id, n] of nodes) {
    nodes.set(id, { ...n, degree: degree.get(id) ?? 0 })
  }

  // 3) Appliquer le layout stabilisé
  const nodesList = [...nodes.values()]
  const layoutResult = applyStabilizedLayout(nodesList, pivots, existingPositions)
  
  // 4) Sauvegarde du graphe avec positions
  const graph = { 
    nodes: nodesList, 
    edges: edgeList,
    metadata: {
      generatedAt: new Date().toISOString(),
      billetsCount: files.length,
      nodesCount: nodes.size,
      edgesCount: edges.length,
      stability: {
        pivotsLocked: layoutResult.stats.pivotLocked,
        newNodes: layoutResult.stats.newNodes,
        avgMovement: Math.round(layoutResult.stats.avgMovement * 100) / 100
      }
    }
  }
  
  // 5) Sauvegarder les positions pour le prochain build
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true })
  await fs.writeFile(OUT_PATH, JSON.stringify(graph, null, 2))
  await fs.writeFile(POSITIONS_PATH, JSON.stringify(layoutResult.positions, null, 2))
  
  console.log(`✅ graph-billets.json généré →`)
  console.log(`   📄 ${files.length} billets analysés`)
  console.log(`   🔗 ${graph.nodes.length} nœuds, ${graph.edges.length} arêtes`)
  
  // Statistiques de stabilité
  const { stats } = layoutResult
  console.log(`   📍 Stabilité: ${stats.pivotLocked} pivots verrouillés, ${stats.newNodes} nouveaux nœuds`)
  if (stats.avgMovement > 0) {
    console.log(`   🔄 Mouvement moyen: ${stats.avgMovement.toFixed(1)}px`)
  }
  
  // Statistiques des degrés
  const degrees = [...nodes.values()].map(n => n.degree).sort((a, b) => b - a)
  if (degrees.length > 0) {
    console.log(`   📊 Degré max: ${degrees[0]}, médian: ${degrees[Math.floor(degrees.length/2)]}`)
  }
  
  // Nœuds les plus connectés
  const topNodes = [...nodes.values()]
    .sort((a, b) => (b.degree || 0) - (a.degree || 0))
    .slice(0, 3)
  
  if (topNodes.length > 0) {
    console.log(`   🌟 Billets les plus connectés:`)
    topNodes.forEach(n => {
      console.log(`      - "${n.label}" (degré: ${n.degree})`)
    })
  }
}

main().catch(err => { 
  console.error('❌ Erreur:', err) 
  process.exit(1) 
})