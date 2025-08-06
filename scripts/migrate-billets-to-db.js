const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const prisma = new PrismaClient()

async function migrateBilletsToDatabase() {
  console.log('🚀 Démarrage de la migration des billets vers la base de données...')
  
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
      
      // Parser la date de manière robuste
      let parsedDate
      if (frontmatter.date) {
        // Nettoyer la date (enlever les guillemets français et autres caractères)
        const cleanDate = String(frontmatter.date)
          .replace(/[«»"'"]/g, '') // Enlever guillemets français et anglais
          .trim()
        
        // Essayer de parser la date
        const dateAttempt = new Date(cleanDate)
        
        // Si la date est invalide, essayer avec le slug
        if (isNaN(dateAttempt.getTime())) {
          const slugDateMatch = slug.match(/^(\d{4}-\d{2}-\d{2})/)
          if (slugDateMatch) {
            parsedDate = new Date(slugDateMatch[1])
          } else {
            parsedDate = new Date('2025-01-01')
          }
        } else {
          parsedDate = dateAttempt
        }
      } else {
        // Pas de date dans frontmatter, essayer d'extraire du slug
        const slugDateMatch = slug.match(/^(\d{4}-\d{2}-\d{2})/)
        if (slugDateMatch) {
          parsedDate = new Date(slugDateMatch[1])
        } else {
          parsedDate = new Date('2025-01-01')
        }
      }
      
      console.log(`📅 Date parsée pour ${slug}: ${parsedDate.toISOString().split('T')[0]}`)
      
      // Créer ou mettre à jour le billet dans la DB
      await prisma.billet.upsert({
        where: { slug },
        update: {
          title: frontmatter.title || slug,
          content: markdownContent,
          excerpt: excerpt || null,
          tags: frontmatter.tags || [],
          date: parsedDate,
        },
        create: {
          slug,
          title: frontmatter.title || slug,
          content: markdownContent,
          excerpt: excerpt || null,
          tags: frontmatter.tags || [],
          date: parsedDate,
        }
      })
      
      console.log(`✅ Billet "${slug}" migré avec succès`)
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