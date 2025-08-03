const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const testArticles = [
  {
    title: "Introduction à la philosophie contemporaine",
    description: "Un aperçu des courants philosophiques du XXIe siècle et de leurs implications pour notre compréhension du monde moderne.",
    author: "Aubin Robert",
    fileName: "introduction-philosophie-contemporaine.pdf",
    filePath: "/pdfs/introduction-philosophie-contemporaine.pdf",
    fileSize: 245000,
    tags: ["philosophie contemporaine", "introduction", "courants philosophiques"],
    category: "Introduction"
  },
  {
    title: "L'éthique à l'ère du numérique",
    description: "Réflexions sur les défis éthiques posés par les nouvelles technologies et l'intelligence artificielle.",
    author: "Aubin Robert",
    fileName: "ethique-ere-numerique.pdf", 
    filePath: "/pdfs/ethique-ere-numerique.pdf",
    fileSize: 312000,
    tags: ["éthique", "numérique", "intelligence artificielle", "technologie"],
    category: "Éthique appliquée"
  }
]

async function main() {
  console.log('🌱 Ajout d\'articles de test...')
  
  for (const article of testArticles) {
    try {
      const existingArticle = await prisma.article.findUnique({
        where: { fileName: article.fileName }
      })
      
      if (existingArticle) {
        console.log(`⚠️  Article "${article.title}" existe déjà, ignoré.`)
        continue
      }
      
      const created = await prisma.article.create({
        data: article
      })
      
      console.log(`✅ Article créé: "${created.title}" (ID: ${created.id})`)
    } catch (error) {
      console.error(`❌ Erreur lors de la création de "${article.title}":`, error.message)
    }
  }
  
  const count = await prisma.article.count()
  console.log(`🎉 Total d'articles dans la base: ${count}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur générale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })