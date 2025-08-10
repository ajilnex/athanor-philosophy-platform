/**
 * Sync billets from filesystem into DB (UPsert).
 * - If a billet exists, update its title/excerpt/tags (keeps slug & createdAt).
 * - If not, create it.
 */
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const BILLETS_DIR = path.join(process.cwd(), 'content', 'billets')

function deriveExcerpt(md, max = 220) {
  const noYaml = md.replace(/^---[\s\S]*?---\s*/, '')
  const text = noYaml.replace(/<!--.*?-->/gs, '').replace(/[*_`#>$begin:math:display$$end:math:display$()!-]/g, ' ').replace(/\s+/g,' ').trim()
  return text.slice(0, max)
}

async function main() {
  console.log('🚀 Démarrage de la synchronisation bidirectionnelle des billets...')
  const files = fs.readdirSync(BILLETS_DIR).filter(f => f.endsWith('.md'))
  console.log(`📁 Trouvé ${files.length} fichiers de billets`)

  for (const filename of files) {
    const full = path.join(BILLETS_DIR, filename)
    const slug = filename.replace(/\.md$/, '')
    const fileContent = fs.readFileSync(full, 'utf8')
    const { data: frontmatter, content } = matter(fileContent)

    // Title: prefer YAML title; fallback to slug
    const finalTitle = (frontmatter?.title && String(frontmatter.title).trim()) || slug
    const excerpt = deriveExcerpt(fileContent)
    const tags = Array.isArray(frontmatter?.tags) ? frontmatter.tags : []

    // Keep createdAt from filename prefix if present (YYYY-MM-DD-... or ISO-ish)
    let createdAt = undefined
    const m = slug.match(/^\d{4}-\d{2}-\d{2}/)
    if (m) {
      const iso = `${m[0]}T00:00:00.000Z`
      createdAt = new Date(iso)
    }

    const res = await prisma.billet.upsert({
      where: { slug },
      create: {
        slug,
        title: finalTitle,
        excerpt,
        tags,
        ...(createdAt ? { createdAt } : {}),
      },
      update: {
        title: finalTitle,
        excerpt,
        tags,
        updatedAt: new Date(),
      },
    })

    if (res) {
      console.log(`↻ Upsert "${slug}" → title="${finalTitle}"`)
    }
  }

  console.log('🎉 Synchronisation terminée avec succès!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
