const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

const articles = [
  {
    title: 'Résurgence et dépassement de la métaphysique',
    description:
      'Une exploration de la résurgence contemporaine de la métaphysique et de ses perspectives de dépassement dans la philosophie moderne.',
    author: 'Aubin Robert',
    fileName: 'Résurgence et dépassement de la métaphysique.pdf',
    filePath: '/pdfs/Résurgence et dépassement de la métaphysique.pdf',
    fileSize: 294962,
    tags: ['métaphysique', 'philosophie contemporaine', 'dépassement'],
    category: 'Métaphysique',
  },
  {
    title: 'Fini-Infini',
    description:
      "Une réflexion sur la dialectique entre le fini et l'infini dans la pensée philosophique.",
    author: 'Aubin Robert',
    fileName: 'Fini-Infini.pdf',
    filePath: '/pdfs/Fini-Infini.pdf',
    fileSize: 251658,
    tags: ['fini', 'infini', 'dialectique', 'ontologie'],
    category: 'Ontologie',
  },
  {
    title: 'Dialectique négative et pensée utopique',
    description:
      "Analyse de la dialectique négative d'Adorno et de son rapport à la pensée utopique.",
    author: 'Aubin Robert',
    fileName: 'Dialectique négative et pensée utopique.pdf',
    filePath: '/pdfs/Dialectique négative et pensée utopique.pdf',
    fileSize: 267894,
    tags: ['dialectique négative', 'Adorno', 'utopie', 'école de Francfort'],
    category: 'Philosophie critique',
  },
  {
    title: "De l'Éthique spinoziste au Care",
    description:
      "Une étude comparative entre l'éthique de Spinoza et l'éthique du care contemporaine.",
    author: 'Aubin Robert',
    fileName: "De l'Éthique spinoziste au Care.pdf",
    filePath: "/pdfs/De l'Éthique spinoziste au Care.pdf",
    fileSize: 279341,
    tags: ['Spinoza', 'éthique du care', 'éthique', 'philosophie morale'],
    category: 'Éthique',
  },
  {
    title: "De l'espace chez Kant aux espaces de la physique contemporaine",
    description:
      "Évolution du concept d'espace de la philosophie kantienne aux théories physiques modernes.",
    author: 'Aubin Robert',
    fileName: "De l'espace chez Kant aux espaces de la physique contemporaine.pdf",
    filePath: "/pdfs/De l'espace chez Kant aux espaces de la physique contemporaine.pdf",
    fileSize: 308795,
    tags: ['Kant', 'espace', 'physique', 'épistémologie'],
    category: 'Philosophie des sciences',
  },
  {
    title: "De l'Être et du Néant de Sartre aux Écrits de Lacan",
    description: "Dialogue entre l'existentialisme sartrien et la psychanalyse lacanienne.",
    author: 'Aubin Robert',
    fileName: "De l'Être et du Néant de Sartre aux Écrits de Lacan.pdf",
    filePath: "/pdfs/De l'Être et du Néant de Sartre aux Écrits de Lacan.pdf",
    fileSize: 321548,
    tags: ['Sartre', 'Lacan', 'existentialisme', 'psychanalyse'],
    category: 'Existentialisme',
  },
  {
    title: 'Critique de la modernité liquide',
    description: 'Une critique philosophique du concept de modernité liquide de Zygmunt Bauman.',
    author: 'Aubin Robert',
    fileName: 'Critique de la modernité liquide.pdf',
    filePath: '/pdfs/Critique de la modernité liquide.pdf',
    fileSize: 287643,
    tags: ['modernité liquide', 'Bauman', 'critique sociale', 'sociologie'],
    category: 'Philosophie sociale',
  },
]

async function main() {
  console.log('🌱 Début du peuplement de la base de données...')

  for (const article of articles) {
    try {
      const existingArticle = await prisma.article.findUnique({
        where: { fileName: article.fileName },
      })

      if (existingArticle) {
        console.log(`⚠️  Article "${article.title}" existe déjà, ignoré.`)
        continue
      }

      const created = await prisma.article.create({
        data: article,
      })

      console.log(`✅ Article créé: "${created.title}"`)
    } catch (error) {
      console.error(`❌ Erreur lors de la création de "${article.title}":`, error.message)
    }
  }

  const count = await prisma.article.count()
  console.log(`🎉 Peuplement terminé! Total d'articles: ${count}`)
}

main()
  .catch(e => {
    console.error('❌ Erreur générale:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
