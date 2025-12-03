import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("🔥 Nettoyage des données de l'archive FEU HUMAIN...")

  const archive = await prisma.conversationArchive.findUnique({
    where: {
      slug: 'feu-humain',
    },
    select: {
      id: true,
    },
  })

  if (!archive) {
    console.log('✅ Aucune archive FEU HUMAIN à nettoyer.')
    return
  }

  // La suppression en cascade est gérée par le schéma Prisma
  const deletedArchive = await prisma.conversationArchive.delete({
    where: {
      slug: 'feu-humain',
    },
  })

  console.log(
    `✅ L'archive "${deletedArchive.title}" et toutes ses données associées ont été supprimées.`
  )
  console.log('La base de données est prête pour un nouvel import.')
}

main()
  .catch(e => {
    console.error('❌ Une erreur est survenue lors du nettoyage :', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
