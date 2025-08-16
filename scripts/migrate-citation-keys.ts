#!/usr/bin/env ts-node

/**
 * Migration des clés de citations vers les Better BibTeX keys (bbtKey)
 *
 * - Lit public/bibliography.json (généré après bascule key=bbtKey)
 * - Construit une map legacyKey -> key
 * - Réécrit toutes les occurrences <Cite item="..." /> dans content/billets
 * - Affiche un rapport des remplacements
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

type BiblioEntry = {
  key: string
  bbtKey?: string
  legacyKey?: string
}

const ROOT = process.cwd()
const BIB_PATH = path.join(ROOT, 'public', 'bibliography.json')
const CONTENT_DIR = path.join(ROOT, 'content', 'billets')

function loadBibliography(): BiblioEntry[] {
  if (!fs.existsSync(BIB_PATH)) {
    throw new Error(
      `Bibliography file not found: ${BIB_PATH}. Run npm run bibliography:build first.`
    )
  }
  const raw = fs.readFileSync(BIB_PATH, 'utf8')
  return JSON.parse(raw)
}

function buildLegacyToNewMap(entries: BiblioEntry[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const e of entries) {
    if (e.legacyKey && e.key && e.legacyKey !== e.key) {
      map[e.legacyKey] = e.key
    }
  }
  return map
}

function migrateFile(
  filePath: string,
  map: Record<string, string>
): { changed: boolean; count: number } {
  const content = fs.readFileSync(filePath, 'utf8')
  const citeRegex = /<Cite\s+item=("|')([^"']+)(\1)([^>]*)\/?>(?:<\/Cite>)?/g

  let changed = false
  let count = 0
  const newContent = content.replace(citeRegex, (match, quote, key, _q2, rest) => {
    const newKey = map[key]
    if (!newKey) return match
    changed = true
    count += 1
    return `<Cite item=${quote}${newKey}${quote}${rest} />`
  })

  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8')
  }

  return { changed, count }
}

async function run() {
  console.log('🔁 Migration des clés de citations vers Better BibTeX...')
  const entries = loadBibliography()
  const map = buildLegacyToNewMap(entries)

  const legacyCount = Object.keys(map).length
  console.log(`   🗺️  ${legacyCount} correspondances legacyKey -> bbtKey trouvées`)

  if (legacyCount === 0) {
    console.log('✅ Rien à migrer (aucune legacyKey différente)')
    return
  }

  const pattern = path.join(CONTENT_DIR, '**/*.mdx')
  const files = await glob(pattern)
  console.log(`   📄 ${files.length} fichiers MDX à analyser`)

  let filesChanged = 0
  let totalReplacements = 0
  for (const file of files) {
    const { changed, count } = migrateFile(file, map)
    if (changed) {
      filesChanged += 1
      totalReplacements += count
      console.log(`   ✏️  ${path.relative(ROOT, file)} → ${count} remplacement(s)`)
    }
  }

  if (filesChanged === 0) {
    console.log('✅ Aucun fichier modifié (déjà à jour)')
  } else {
    console.log(
      `✅ Migration terminée: ${filesChanged} fichier(s) modifié(s), ${totalReplacements} remplacement(s)`
    )
  }
}

run().catch(err => {
  console.error('❌ Échec migration:', err)
  process.exit(1)
})
