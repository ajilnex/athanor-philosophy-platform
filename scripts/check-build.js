#!/usr/bin/env node

/**
 * Smoke Test pour vérifier l'intégrité du build
 * Contrôle que les fichiers essentiels ont été générés correctement
 * Inclut un read-lock pour attendre la fin d'un build en cours.
 */

const fs = require('fs')
const path = require('path')

const LOCK_FILE = path.join(process.cwd(), '.buildlock', 'lock')
const MAX_WAIT_SECONDS = 60

// Fichiers critiques à vérifier
const CRITICAL_FILES = [
  {
    path: 'public/search-index.json',
    description: 'Index de recherche unifié',
    minSize: 1000, // Taille minimale en octets
  },
  {
    path: 'public/bibliography.json',
    description: 'Bibliographie Zotero',
    minSize: 100,
  },
  {
    path: 'public/graph-billets.json',
    description: 'Données du graphe des billets',
    minSize: 500,
  },
  {
    path: 'public/graph-billets.svg',
    description: 'Rendu SVG du graphe',
    minSize: 2000,
  },
  {
    path: '.next',
    description: 'Build Next.js',
    isDirectory: true,
  },
]

async function waitForLockRelease() {
  const startTime = Date.now()
  while (fs.existsSync(LOCK_FILE)) {
    const elapsedTime = (Date.now() - startTime) / 1000
    if (elapsedTime > MAX_WAIT_SECONDS) {
      console.error(
        `❌ Timeout: Le fichier de lock (.buildlock/lock) est présent depuis plus de ${MAX_WAIT_SECONDS} secondes.`
      )
      console.error(
        '   Un autre processus de build est peut-être bloqué. Supprimez le dossier .buildlock manuellement si vous êtes sûr.'
      )
      process.exit(1)
    }
    console.log(`⏳ Un build est en cours... Attente de la libération du lock (.buildlock/lock).`)
    await new Promise(resolve => setTimeout(resolve, 5000)) // Attendre 5 secondes
  }
}

function checkFile(fileConfig) {
  const fullPath = path.join(process.cwd(), fileConfig.path)

  try {
    const stats = fs.statSync(fullPath)

    if (fileConfig.isDirectory) {
      if (!stats.isDirectory()) {
        throw new Error(`Expected directory but found file`)
      }
      console.log(`✅ ${fileConfig.description}: Directory exists`)
      return true
    } else {
      if (!stats.isFile()) {
        throw new Error(`Expected file but found directory`)
      }

      const fileSize = stats.size
      if (fileConfig.minSize && fileSize < fileConfig.minSize) {
        throw new Error(`File too small (${fileSize}b < ${fileConfig.minSize}b)`)
      }

      console.log(`✅ ${fileConfig.description}: ${(fileSize / 1024).toFixed(1)}KB`)
      return true
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`❌ ${fileConfig.description}: File not found`)
    } else {
      console.error(`❌ ${fileConfig.description}: ${error.message}`)
    }
    return false
  }
}

async function runSmokeTest() {
  await waitForLockRelease()

  console.log('🚀 Smoke Test du Build Athanor')
  console.log('=====================================\n')

  let allPassed = true

  for (const fileConfig of CRITICAL_FILES) {
    const passed = checkFile(fileConfig)
    if (!passed) {
      allPassed = false
    }
  }

  console.log('\n=====================================')

  if (allPassed) {
    console.log('🎉 Smoke Test RÉUSSI - Build fonctionnel')
    process.exit(0)
  } else {
    console.error('💥 Smoke Test ÉCHEC - Build défectueux')
    process.exit(1)
  }
}

// Exécution
if (require.main === module) {
  runSmokeTest()
}

module.exports = { runSmokeTest }
