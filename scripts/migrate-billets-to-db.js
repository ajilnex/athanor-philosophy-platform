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
  console.log('🚀 Démarrage de la migration des billets vers la base de données...')
  
  // Assurer l'historique Git pour les dates
  ensureGitHistory()
  
  const billetsDir = path.join(process.cwd(), 'content/billets')
  
  try {
    // Lire tous les fichiers .md
    const files = fs.readdirSync(billetsDir).filter(file => file.endsWith('.md'))
    console.log(`📁 Trouvé ${files.length} fichiers de billets`)
    
    for (const fileName of files) {
      const slug = fileName.replace('.md', '')
      const filePath = path.join(billetsDir, fileName)
      
      console.log(`📝 Migration du billet: ${slug}`)
      
      // Lire et parser le fichier Markdown
      const fileContent = fs.readFileSync(filePath, 'utf8')
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
        await prisma.billet.create({
          data: {
            slug,
            title: frontmatter.title || slug,
            content: markdownContent,
            excerpt: excerpt || null,
            tags: frontmatter.tags || [],
            date: parsedDate,
          }
        })
        console.log(`✅ Nouveau billet "${slug}" créé en DB`)
      }
    }
    
    console.log('🎉 Migration terminée avec succès!')
    
    // Afficher un résumé
    const totalBillets = await prisma.billet.count()
    console.log(`📊 Total des billets en base: ${totalBillets}`)
    
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