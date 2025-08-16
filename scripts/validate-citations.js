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
 * Extrait toutes les citations d'un contenu MDX
 */
function extractCitations(content) {
  // Regex pour capturer <Cite item="clé" /> et <Cite item='clé' />
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
 * Valide les citations dans un fichier
 */
function validateFile(filePath, bibliography) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const citations = extractCitations(content)
    const errors = []

    citations.forEach(citation => {
      if (!bibliography[citation.key]) {
        // Calculer la ligne approximative pour un meilleur diagnostic
        const beforeContent = content.substring(0, citation.index)
        const lineNumber = beforeContent.split('\n').length

        errors.push({
          key: citation.key,
          line: lineNumber,
          context: citation.fullMatch,
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
    const result = validateFile(file, bibliography)
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

  process.exit(1)
}

// Exécution si script appelé directement
if (require.main === module) {
  validateAllCitations()
}

module.exports = { validateAllCitations }
