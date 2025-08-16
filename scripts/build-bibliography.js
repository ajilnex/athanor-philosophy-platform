#!/usr/bin/env node

/**
 * Script de construction de la bibliographie
 * Récupère les références depuis l'API Zotero et génère public/bibliography.json
 * Corrections:
 *  - Extraction correcte des citekeys Better BibTeX depuis item.data.extra
 *  - Pagination de l'API Zotero (>100 items)
 *  - Enrichissement du JSON avec des champs de style CSL (author[], editor[], issued, container-title)
 */

const fs = require('fs')
const path = require('path')

// Configuration Zotero
const ZOTERO_GROUP_ID = process.env.ZOTERO_GROUP_ID
const ZOTERO_API_KEY = process.env.ZOTERO_API_KEY
const ZOTERO_API_BASE = 'https://api.zotero.org/groups'
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'bibliography.json')

/**
 * Génère une clé de citation fallback déterministe
 */
function generateFallbackKey(item) {
  // Auteur principal
  const firstAuthor = item.creators?.find(c => c.creatorType === 'author')
  const authorName = firstAuthor
    ? firstAuthor.lastName || firstAuthor.name || 'anonymous'
    : 'anonymous'

  // Année
  const year = item.date ? extractYear(item.date) : 'nodate'

  // Titre court (premiers mots significatifs)
  const titleWords =
    item.title
      ?.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s]/g, '') // Garde lettres, chiffres et espaces
      .split(/\s+/)
      .filter(
        word =>
          word.length > 2 && !['the', 'and', 'une', 'des', 'les', 'sur', 'dans'].includes(word)
      )
      .slice(0, 2) // Premiers 2 mots significatifs
      .join('-') || 'notitle'

  return `${authorName}-${year}-${titleWords}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extrait l'année d'une date Zotero
 */
function extractYear(dateString) {
  if (!dateString) return 'nodate'
  const match = dateString.match(/\b(\d{4})\b/)
  return match ? match[1] : 'nodate'
}

/**
 * Extrait une structure CSL issued { 'date-parts': [[YYYY, MM?, DD?]] }
 */
function extractIssued(dateString) {
  if (!dateString) return undefined
  const yearMatch = dateString.match(/\b(\d{4})\b/)
  if (!yearMatch) return undefined
  const year = parseInt(yearMatch[1], 10)
  // Tente de détecter mois/jour (formats communs)
  const ymdMatch = dateString.match(/(\d{4})[-\/.](\d{1,2})(?:[-\/.](\d{1,2}))?/)
  if (ymdMatch) {
    const m = Math.max(1, Math.min(12, parseInt(ymdMatch[2], 10)))
    const d = ymdMatch[3] ? Math.max(1, Math.min(31, parseInt(ymdMatch[3], 10))) : undefined
    return { 'date-parts': [[year, m, ...(d ? [d] : [])]] }
  }
  return { 'date-parts': [[year]] }
}

/** Formate un nom complet "Family, Given" ou fallback */
function formatName(c) {
  const family = c.lastName || c.family || c.name || ''
  const given = c.firstName || c.given || ''
  if (!family && !given) return 'Auteur inconnu'
  if (family && !given) return family
  if (!family && given) return given
  return `${family}, ${given}`
}

/**
 * Normalise un item Zotero vers notre format
 */
function normalizeZoteroItem(item) {
  // Récupérer la citekey Better BibTeX si disponible (dans item.data.extra)
  const citekey = item.data?.extra?.match(/Citation Key:\s*([^\n\r]+)/i)?.[1]?.trim()

  const data = item.data || {}
  const creators = Array.isArray(data.creators) ? data.creators : []

  const authorsCreators = creators.filter(c => c.creatorType === 'author')
  const editorsCreators = creators.filter(c => c.creatorType === 'editor')

  const authors = authorsCreators.map(author => ({
    family: author.lastName || '',
    given: author.firstName || '',
  }))
  const authorNames = authorsCreators.map(formatName)
  const editorNames = editorsCreators.map(formatName)

  const fallbackKey = generateFallbackKey(data)
  const primaryKey = citekey || fallbackKey

  return {
    // Clé principale désormais = Better BibTeX si dispo, sinon fallback déterministe
    key: primaryKey,
    // Expose les deux pour transparence et migrations
    bbtKey: citekey || '',
    legacyKey: fallbackKey,
    type: data.itemType,
    title: data.title || '',
    // Schéma existant (composants Bibliography/Cite)
    authors,
    year: extractYear(data.date),
    container: data.publicationTitle || data.bookTitle || data.university || '',
    DOI: data.DOI || '',
    URL: data.url || '',
    ISBN: data.ISBN || '',
    tags: (data.tags || []).map(tag => tag.tag),
    volume: data.volume || '',
    issue: data.issue || '',
    pages: data.pages || '',
    publisher: data.publisher || '',
    place: data.place || '',
    // Champs CSL-like pour l'éditeur (CitationPicker)
    author: authorNames, // ex: ["Durkheim, Émile", ...]
    editor: editorNames,
    issued: extractIssued(data.date),
    'container-title': data.publicationTitle || data.bookTitle || data.university || '',
    page: data.pages || '',
    abstract: data.abstractNote || '',
  }
}

/**
 * Récupère les items depuis l'API Zotero
 */
async function fetchZoteroItems() {
  if (!ZOTERO_GROUP_ID || !ZOTERO_API_KEY) {
    // Manque de configuration: remonter une erreur pour permettre un fallback sur le fichier existant
    throw new Error('Variables Zotero manquantes (ZOTERO_GROUP_ID/ZOTERO_API_KEY)')
  }

  console.log(`📚 Récupération depuis Zotero (groupe ${ZOTERO_GROUP_ID})...`)

  const limit = 100
  let start = 0
  const allItems = []

  try {
    // Boucle de pagination tant que Link: rel="next" présent
    while (true) {
      const url = `${ZOTERO_API_BASE}/${ZOTERO_GROUP_ID}/items?format=json&include=data&limit=${limit}&start=${start}`
      const response = await fetch(url, {
        headers: {
          'Zotero-API-Key': ZOTERO_API_KEY,
          'Zotero-API-Version': '3',
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur API Zotero: ${response.status} ${response.statusText}`)
      }

      const items = await response.json()
      allItems.push(...items)

      const linkHeader = response.headers.get('Link') || response.headers.get('link')
      const hasNext = linkHeader && /<[^>]+>;\s*rel="next"/.test(linkHeader)

      if (!hasNext || items.length < limit) {
        break
      }

      start += limit
    }

    console.log(`   ✅ ${allItems.length} items récupérés (toutes pages) `)

    return allItems.filter(
      item => item.data && item.data.itemType !== 'attachment' && item.data.itemType !== 'note'
    )
  } catch (error) {
    console.error('❌ Erreur lors de la récupération Zotero:', error.message)
    throw error
  }
}

/**
 * Construit et valide la bibliographie
 */
async function buildBibliography() {
  console.log('🏗️  Construction de la bibliographie...')

  try {
    // Récupération des données
    const zoteroItems = await fetchZoteroItems()

    // Normalisation
    const bibliography = zoteroItems.map(normalizeZoteroItem)

    // Gestion robuste des clés dupliquées
    const keyMap = new Map()
    const uniqueBibliography = []
    const duplicateKeys = []

    for (const item of bibliography) {
      const originalKey = item.key
      let finalKey = originalKey
      let counter = 1

      // Si la clé existe déjà, ajouter un suffixe numérique
      while (keyMap.has(finalKey)) {
        finalKey = `${originalKey}-${counter}`
        counter++
        if (!duplicateKeys.includes(originalKey)) {
          duplicateKeys.push(originalKey)
        }
      }

      // Mettre à jour la clé si nécessaire
      if (finalKey !== originalKey) {
        console.warn(`⚠️  Clé dupliquée résolue: ${originalKey} → ${finalKey}`)
        item.key = finalKey
      }

      keyMap.set(finalKey, item)
      uniqueBibliography.push(item)
    }

    if (duplicateKeys.length > 0) {
      console.warn(
        `⚠️  ${duplicateKeys.length} clés dupliquées détectées et résolues:`,
        duplicateKeys
      )
      console.warn(
        '   💡 Conseil: vérifiez vos citekeys Better BibTeX dans Zotero pour éviter les doublons'
      )
    }

    // Tri alphabétique par auteur principal puis année
    uniqueBibliography.sort((a, b) => {
      const authorA = a.authors[0]?.family || ''
      const authorB = b.authors[0]?.family || ''
      if (authorA !== authorB) return authorA.localeCompare(authorB)
      return (b.year || '').localeCompare(a.year || '')
    })

    // Statistiques
    const withDOI = uniqueBibliography.filter(item => item.DOI).length
    const withoutDOI = uniqueBibliography.length - withDOI

    console.log(`   📊 ${uniqueBibliography.length} entrées normalisées`)
    console.log(`   🔗 ${withDOI} avec DOI, ${withoutDOI} sans DOI`)

    if (withoutDOI > 0) {
      console.warn(`   ⚠️  ${withoutDOI} entrées sans DOI (recommandé mais non bloquant)`)
    }

    // Si aucune entrée après normalisation, conserver l'ancien fichier si présent
    if (uniqueBibliography.length === 0) {
      if (fs.existsSync(OUTPUT_PATH)) {
        console.warn(
          '⚠️  Aucune entrée normalisée. Conservation de la bibliographie existante pour éviter une régression.'
        )
        console.log(`✅ Bibliographie conservée: ${OUTPUT_PATH}`)
        return uniqueBibliography
      }
      // Sinon, écrire un fichier vide (premier bootstrap)
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify([], null, 2), 'utf8')
      console.log(`✅ Bibliographie vide générée (bootstrap): ${OUTPUT_PATH}`)
      return uniqueBibliography
    }

    // Écriture du fichier
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueBibliography, null, 2), 'utf8')
    console.log(`✅ Bibliographie générée: ${OUTPUT_PATH}`)

    return uniqueBibliography
  } catch (error) {
    console.error('❌ Échec de la construction de la bibliographie:', error.message)

    // En cas d'erreur Zotero, conserver le dernier JSON si disponible
    if (fs.existsSync(OUTPUT_PATH)) {
      console.warn('⚠️  Zotero indisponible: conservation de la bibliographie existante')
      console.log(`✅ Bibliographie conservée: ${OUTPUT_PATH}`)
      return []
    }

    // Sinon, générer un fichier vide (premier bootstrap)
    console.warn(
      "⚠️  Pas de bibliographie existante, génération d'un fichier vide pour permettre le déploiement"
    )
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify([], null, 2), 'utf8')
    console.log(`✅ Bibliographie vide générée: ${OUTPUT_PATH}`)

    // Ne pas faire échouer le build - c'est un problème de configuration externe
    // process.exit(1);
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  buildBibliography()
}

module.exports = { buildBibliography }
