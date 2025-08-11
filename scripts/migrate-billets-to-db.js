const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const { execSync } = require('child_process')

const prisma = new PrismaClient()

function ensureGitHistory() {
  try {
    // Sur Vercel le clone peut être shallow : on étend si possible, sans casser si déjà complet
    execSync('git fetch --unshallow', { stdio: 'ignore' });
  } catch {}
  try {
    // À défaut, on s'assure d'avoir un minimum d'historique
    execSync('git fetch --depth=1000', { stdio: 'ignore' });
  } catch {}
}

function gitCommitDateFor(absPath) {
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${absPath}"`, { stdio: ['ignore','pipe','ignore'] })
      .toString()
      .trim();
    if (iso) return new Date(iso);
  } catch {}
  return null;
}

function dateFromSlug(slug) {
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? new Date(m[1]) : null;
}

async function migrateBilletsToDatabase() {
  console.log('🚀 Démarrage de la synchronisation bidirectionnelle des billets...')
  
  // Assurer l'historique Git pour les dates
  ensureGitHistory()
  
  const billetsDir = path.join(process.cwd(), 'content/billets')
  
  try {
    // Lire tous les fichiers .mdx
    const files = fs.readdirSync(billetsDir).filter(file => file.endsWith('.mdx'))
    console.log(`📁 Trouvé ${files.length} fichiers de billets`)
    
    for (const fileName of files) {
      const slug = fileName.replace('.mdx', '')
      const filePath = path.join(billetsDir, fileName)
      
      console.log(`📝 Migration du billet: ${slug}`)
      
      // Lire et parser le fichier Markdown
      let fileContent = fs.readFileSync(filePath, 'utf8')
      
      // Nettoyer les doubles front-matters (éliminer le premier s'il contient created/modified)
      if (fileContent.startsWith('---')) {
        const firstEnd = fileContent.indexOf('---', 3)
        if (firstEnd !== -1) {
          const firstFrontmatter = fileContent.slice(4, firstEnd)
          if (firstFrontmatter.includes('created:') || firstFrontmatter.includes('modified:')) {
            fileContent = fileContent.slice(firstEnd + 4).trim()
          }
        }
      }
      
      const { data: frontmatter, content: markdownContent } = matter(fileContent)
      
      // Générer un excerpt à partir du contenu
      const plainText = markdownContent.replace(/[#*`\[\]]/g, '').substring(0, 200).trim()
      const excerpt = plainText.length === 200 ? plainText + '...' : plainText
      
      const absPath = path.join(billetsDir, fileName);

      // 1) Git (dernier commit du fichier)
      let parsedDate = gitCommitDateFor(absPath);

      // 2) Slug (YYYY-MM-DD-...)
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        parsedDate = dateFromSlug(slug);
      }

      // 3) Now (fallback final)
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }

      console.log(`📅 Date retenue pour ${slug}: ${parsedDate.toISOString()}`)
      
      // Vérifier si le billet existe déjà en DB
      const existingBillet = await prisma.billet.findUnique({
        where: { slug }
      })
      
      if (existingBillet) {
        console.log(`⏭️  Billet "${slug}" existe déjà en DB - pas de re-création`)
      } else {
        // Créer SEULEMENT s'il n'existe pas (pas d'update pour préserver les suppressions)
        // Gérer le titre selon les 3 cas
        let finalTitle
        if (frontmatter.title) {
          finalTitle = frontmatter.title
        } else {
          finalTitle = `No name (${parsedDate.toISOString().split('T')[0]})`
        }
        
        await prisma.billet.create({
          data: {
            slug,
            title: finalTitle,
            content: markdownContent,
            excerpt: excerpt || null,
            tags: frontmatter.tags || [],
            date: parsedDate,
          }
        })
        console.log(`✅ Nouveau billet "${slug}" créé en DB`)
      }
    }
    
    // Synchronisation inverse : supprimer de la DB les billets dont le fichier .md n'existe plus
    console.log('🔄 Vérification des billets à supprimer...')
    const allDbBillets = await prisma.billet.findMany({ select: { slug: true } })
    const fileBasedSlugs = files.map(fileName => fileName.replace('.mdx', ''))
    
    let deletedCount = 0
    for (const dbBillet of allDbBillets) {
      if (!fileBasedSlugs.includes(dbBillet.slug)) {
        await prisma.billet.delete({ where: { slug: dbBillet.slug } })
        console.log(`🗑️ Billet "${dbBillet.slug}" supprimé de la DB (fichier .mdx absent)`)
        deletedCount++
      }
    }
    
    console.log('🎉 Synchronisation terminée avec succès!')
    
    // Afficher un résumé
    const totalBillets = await prisma.billet.count()
    console.log(`📊 Total des billets en base: ${totalBillets}`)
    console.log(`📁 Fichiers .mdx trouvés: ${files.length}`)
    console.log(`🗑️ Billets supprimés: ${deletedCount}`)
    
  } catch (error) {
    console.error('❌ Erreur durant la migration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateBilletsToDatabase()
}

module.exports = { migrateBilletsToDatabase }