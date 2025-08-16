#!/usr/bin/env node

/**
 * Script de construction de la carte des citations
 * Génère public/citations-map.json avec les billets citant chaque référence
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')
const matter = require('gray-matter')

const CONTENT_DIR = path.join(process.cwd(), 'content', 'billets')
const BIBLIOGRAPHY_PATH = path.join(process.cwd(), 'public', 'bibliography.json')
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'citations-map.json')

/**
 * Extrait toutes les citations d'un contenu MDX
 */
function extractCitations(content) {
  const citeRegex = /<Cite\s+item=["']([^"']+)["'][^>]*\/?>(?:<\/Cite>)?/gi
  const citations = []
  let match

  while ((match = citeRegex.exec(content)) !== null) {
    citations.push({
      key: match[1],
      fullMatch: match[0],
      index: match.index,
    })
  }

  return citations
}

/**
 * Génère un extrait contextuel autour d'une citation
 */
function generateContextualExcerpt(content, citationIndex, wordsAround = 15) {
  // Supprimer les balises MDX/HTML pour un texte plus propre
  const cleanContent = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  // Trouver les mots autour de la citation
  const words = cleanContent.split(' ')
  const citationWordIndex = Math.floor(citationIndex / (cleanContent.length / words.length))

  const startIndex = Math.max(0, citationWordIndex - wordsAround)
  const endIndex = Math.min(words.length, citationWordIndex + wordsAround)

  const excerpt = words.slice(startIndex, endIndex).join(' ')

  // Ajouter des ellipses si nécessaire
  const prefix = startIndex > 0 ? '...' : ''
  const suffix = endIndex < words.length ? '...' : ''

  return `${prefix}${excerpt}${suffix}`.trim()
}

/**
 * Analyse un fichier et extrait ses citations avec contexte
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const { data: frontMatter, content: mdxContent } = matter(content)

    const slug = path.basename(filePath, path.extname(filePath))
    const title = frontMatter.title || slug

    const citations = extractCitations(mdxContent)

    // Grouper par clé pour éviter les doublons
    const citationsByKey = {}

    citations.forEach(citation => {
      if (!citationsByKey[citation.key]) {
        citationsByKey[citation.key] = {
          slug,
          title,
          excerpt: generateContextualExcerpt(mdxContent, citation.index),
        }
      }
    })

    return Object.entries(citationsByKey).map(([key, data]) => ({
      key,
      ...data,
    }))
  } catch (error) {
    console.error(`❌ Erreur lors de l'analyse de ${filePath}:`, error.message)
    return []
  }
}

/**
 * Construit la carte complète des citations
 */
function buildCitationMap() {
  console.log('🗺️  Construction de la carte des citations...')

  try {
    // Vérifier que la bibliographie existe
    if (!fs.existsSync(BIBLIOGRAPHY_PATH)) {
      console.warn("⚠️  Bibliographie non trouvée, génération d'une carte vide")
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify({}, null, 2), 'utf8')
      return
    }

    // Charger la bibliographie pour valider les clés
    const bibliography = JSON.parse(fs.readFileSync(BIBLIOGRAPHY_PATH, 'utf8'))
    const validKeys = new Set(bibliography.map(entry => entry.key))

    // Trouver tous les fichiers MDX
    const pattern = path.join(CONTENT_DIR, '**/*.mdx')
    const files = glob.sync(pattern)
    console.log(`   📄 ${files.length} fichiers à analyser`)

    // Analyser chaque fichier
    const citationMap = {}
    let totalCitations = 0

    files.forEach(file => {
      const citations = analyzeFile(file)

      citations.forEach(citation => {
        if (!validKeys.has(citation.key)) {
          console.warn(`   ⚠️  Clé invalide "${citation.key}" dans ${citation.slug} (ignorée)`)
          return
        }

        if (!citationMap[citation.key]) {
          citationMap[citation.key] = []
        }

        citationMap[citation.key].push({
          slug: citation.slug,
          title: citation.title,
          excerpt: citation.excerpt,
        })

        totalCitations++
      })
    })

    // Trier les billets par titre pour chaque clé
    Object.keys(citationMap).forEach(key => {
      citationMap[key].sort((a, b) => a.title.localeCompare(b.title))
    })

    // Statistiques
    const uniqueKeys = Object.keys(citationMap).length
    console.log(`   🔗 ${totalCitations} citations trouvées`)
    console.log(`   📚 ${uniqueKeys} références citées`)

    // Écriture du fichier
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(citationMap, null, 2), 'utf8')
    console.log(`✅ Carte des citations générée: ${OUTPUT_PATH}`)

    return citationMap
  } catch (error) {
    console.error('❌ Échec de la construction de la carte des citations:', error.message)
    process.exit(1)
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  buildCitationMap()
}

module.exports = { buildCitationMap }
