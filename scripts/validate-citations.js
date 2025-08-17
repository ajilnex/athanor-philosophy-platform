#!/usr/bin/env node

/**
 * Script de validation des citations
 * Vérifie que toutes les citations <Cite item="..."> pointent vers des entrées existantes
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

const CONTENT_DIR = path.join(process.cwd(), 'content', 'billets')
const BIBLIOGRAPHY_PATH = path.join(process.cwd(), 'public', 'bibliography.json')

/**
 * Charge la bibliographie
 */
function loadBibliography() {
  try {
    if (!fs.existsSync(BIBLIOGRAPHY_PATH)) {
      console.warn('⚠️  Bibliographie non trouvée, validation ignorée')
      return {}
    }

    const content = fs.readFileSync(BIBLIOGRAPHY_PATH, 'utf8')
    const bibliography = JSON.parse(content)

    // Créer un index des clés pour recherche rapide
    const keyIndex = {}
    bibliography.forEach(entry => {
      keyIndex[entry.key] = entry
    })

    return keyIndex
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la bibliographie:', error.message)
    process.exit(1)
  }
}

/**
 * Supprime les blocs de code (``` ... ```) et le code inline (`...`) pour éviter les faux positifs
 */
function stripCode(content) {
  // Blocs de code fenced
  let stripped = content.replace(/```[\s\S]*?```/g, '')
  // Code inline
  stripped = stripped.replace(/`[^`]*`/g, '')
  return stripped
}

/**
 * Extrait toutes les citations d'un contenu MDX (hors zones de code)
 */
function extractCitations(content) {
  const text = stripCode(content)
  const citeRegex = /<Cite\s+item=["']([^"']+)["'][^>]*\/?>(?:<\/Cite>)?/gi
  const citations = []
  let match

  while ((match = citeRegex.exec(text)) !== null) {
    citations.push({
      key: match[1],
      fullMatch: match[0],
      index: match.index,
    })
  }

  return citations
}

/** Levenshtein distance pour suggestions de clés proches */
function levenshtein(a, b) {
  const an = a.length
  const bn = b.length
  if (an === 0) return bn
  if (bn === 0) return an
  const matrix = Array.from({ length: an + 1 }, () => new Array(bn + 1).fill(0))
  for (let i = 0; i <= an; i++) matrix[i][0] = i
  for (let j = 0; j <= bn; j++) matrix[0][j] = j
  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[an][bn]
}

function suggestClosestKey(targetKey, bibliographyEntries) {
  let best = { key: null, dist: Infinity }
  bibliographyEntries.forEach(entry => {
    const candidates = [entry.key, entry.legacyKey].filter(Boolean)
    candidates.forEach(candidate => {
      const d = levenshtein(String(targetKey), String(candidate))
      if (d < best.dist) best = { key: candidate, dist: d }
    })
  })
  // Seuil simple: suggérer si distance <= 3 ou si longueur courte
  if (best.key && (best.dist <= 3 || String(targetKey).length <= 6)) return best.key
  return null
}

/**
 * Valide les citations dans un fichier
 */
function validateFile(filePath, bibliography, bibliographyEntries) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const citations = extractCitations(content)
    const errors = []

    citations.forEach(citation => {
      if (!bibliography[citation.key]) {
        // Calculer la ligne approximative pour un meilleur diagnostic
        const beforeContent = content.substring(0, citation.index)
        const lineNumber = beforeContent.split('\n').length
        const suggestion = suggestClosestKey(citation.key, bibliographyEntries)

        errors.push({
          key: citation.key,
          line: lineNumber,
          context: citation.fullMatch,
          suggestion,
        })
      }
    })

    return {
      file: filePath,
      totalCitations: citations.length,
      errors,
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de ${filePath}:`, error.message)
    return {
      file: filePath,
      totalCitations: 0,
      errors: [{ key: 'LECTURE_ERROR', line: 0, context: error.message }],
    }
  }
}

/**
 * Valide toutes les citations dans les billets
 */
function validateAllCitations() {
  console.log('🔍 Validation des citations dans les billets...')

  // Charger la bibliographie
  const bibliography = loadBibliography()
  const bibliographyEntries = []
  try {
    const raw = fs.readFileSync(BIBLIOGRAPHY_PATH, 'utf8')
    const entries = JSON.parse(raw)
    if (Array.isArray(entries)) bibliographyEntries.push(...entries)
  } catch {}
  const bibliographyCount = Object.keys(bibliography).length
  console.log(`   📚 ${bibliographyCount} entrées dans la bibliographie`)

  // Trouver tous les fichiers MDX
  const pattern = path.join(CONTENT_DIR, '**/*.mdx')
  const files = glob.sync(pattern)
  console.log(`   📄 ${files.length} fichiers à vérifier`)

  if (files.length === 0) {
    console.log('✅ Aucun fichier à valider')
    return
  }

  // Valider chaque fichier
  let totalCitations = 0
  let totalErrors = 0
  const fileErrors = []

  files.forEach(file => {
    const result = validateFile(file, bibliography, bibliographyEntries)
    totalCitations += result.totalCitations

    if (result.errors.length > 0) {
      totalErrors += result.errors.length
      fileErrors.push(result)
    }
  })

  // Rapport de validation
  console.log(`   🔗 ${totalCitations} citations trouvées au total`)

  if (totalErrors === 0) {
    console.log('✅ Toutes les citations sont valides')
    return
  }

  // Afficher les erreurs détaillées
  console.log(`\n❌ ${totalErrors} citations invalides détectées:\n`)

  fileErrors.forEach(result => {
    const relativePath = path.relative(process.cwd(), result.file)
    console.log(`📄 ${relativePath}:`)

    result.errors.forEach(error => {
      if (error.key === 'LECTURE_ERROR') {
        console.log(`   ❌ Erreur de lecture: ${error.context}`)
      } else {
        console.log(`   ❌ Ligne ${error.line}: Citation introuvable "${error.key}"`)
        if (error.suggestion) {
          console.log(`      Suggestion: avez-vous voulu écrire "${error.suggestion}" ?`)
        }
        console.log(`      Contexte: ${error.context}`)
      }
    })
    console.log('')
  })

  console.log('💡 Actions suggérées:')
  console.log('   • Vérifiez les clés de citation dans vos billets')
  console.log('   • Ajoutez les références manquantes à votre groupe Zotero')
  console.log('   • Régénérez la bibliographie avec: node scripts/build-bibliography.js')

  // Si la bibliographie est vide (échec Zotero), ne pas faire échouer le build
  if (bibliographyCount === 0) {
    console.warn(
      '⚠️  Bibliographie vide détectée - validation ignorée pour permettre le déploiement'
    )
    console.log("✅ Validation contournée en raison de l'absence de bibliographie")
    return
  }

  // En CI, faire échouer le build. En local, afficher un avertissement mais continuer.
  if (process.env.CI) {
    console.error('\n❌ Build échoué en raison de citations invalides.')
    process.exit(1)
  } else {
    console.warn(
      '\n⚠️ Des citations invalides ont été détectées. Le build local continue, mais cela échouera en CI/production.'
    )
  }
}

// Exécution si script appelé directement
if (require.main === module) {
  validateAllCitations()
}

module.exports = { validateAllCitations }
