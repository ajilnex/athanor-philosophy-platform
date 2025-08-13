import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Vérification des articles/publications existants...\n')
    
    const articles = await prisma.article.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        fileName: true,
        filePath: true,
        fileSize: true,
        isPublished: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    if (articles.length === 0) {
      console.log('❌ Aucune publication trouvée dans la base de données')
      console.log('💡 Il faut peut-être synchroniser les articles depuis les fichiers uploadés')
    } else {
      console.log(`📊 ${articles.length} publication(s) trouvée(s):\n`)
      articles.forEach((article, index) => {
        console.log(`${index + 1}. ID: ${article.id}`)
        console.log(`   Titre: ${article.title}`)
        console.log(`   Auteur: ${article.author || 'Non défini'}`)
        console.log(`   Fichier: ${article.fileName}`)
        console.log(`   Chemin: ${article.filePath}`)
        console.log(`   Taille: ${Math.round(article.fileSize / 1024)}KB`)
        console.log(`   Publié: ${article.isPublished ? '✅ Oui' : '❌ Non'}`)
        console.log(`   Créé le: ${article.createdAt.toLocaleString('fr-FR')}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()