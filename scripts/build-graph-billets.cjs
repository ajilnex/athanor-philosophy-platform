#!/usr/bin/env node

/* Build un graphe billets-only en JSON (noeuds = billets, edges = liens) */
const fs = require('fs/promises')
const path = require('path')
const matter = require('gray-matter')

const BILLETS_DIR = path.join(process.cwd(), 'content', 'billets')
const OUT_PATH = path.join(process.cwd(), 'public', 'graph-billets.json')

/** @typedef {{ id:string, label:string, url:string, degree?:number }} Node */
/** @typedef {{ id:string, source:string, target:string }} Edge */

async function main() {
  console.log('🔗 Construction du graphe des billets...')
  
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

    const me = `billet:${slug}`
    if (!nodes.has(me)) {
      nodes.set(me, { 
        id: me, 
        label: data.title || slug, 
        url: `/billets/${slug}` 
      })
    }

    // a) Wikilinks [[slug]]
    const wikiMatches = [...content.matchAll(/\[\[([^\]]+)\]\]/g)]
    for (const m of wikiMatches) {
      const targetSlug = m[1].trim()
      if (!targetSlug) continue
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

    // b) Liens markdown internes → /billets/target
    const mdMatches = [...content.matchAll(/\]\(\/billets\/([^)#?\s/]+)\)/g)]
    for (const m of mdMatches) {
      const targetSlug = m[1].trim()
      if (!targetSlug) continue
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

  // 3) Sauvegarde
  const graph = { 
    nodes: [...nodes.values()], 
    edges: edgeList,
    metadata: {
      generatedAt: new Date().toISOString(),
      billetsCount: files.length,
      nodesCount: nodes.size,
      edgesCount: edges.length
    }
  }
  
  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true })
  await fs.writeFile(OUT_PATH, JSON.stringify(graph, null, 2))
  
  console.log(`✅ graph-billets.json généré →`)
  console.log(`   📄 ${files.length} billets analysés`)
  console.log(`   🔗 ${graph.nodes.length} nœuds, ${graph.edges.length} arêtes`)
  
  // Statistiques intéressantes
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