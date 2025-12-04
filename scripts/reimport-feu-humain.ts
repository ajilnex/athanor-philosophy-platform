/**
 * Script pour réinitialiser et réimporter l'archive Feu Humain
 * Supprime UNIQUEMENT l'archive feu-humain et ses données associées
 * Ne touche PAS aux autres données (billets, articles, utilisateurs, etc.)
 *
 * Usage: npx dotenv-cli -e .env.local -- tsx scripts/reimport-feu-humain.ts
 */

import { PrismaClient } from '@prisma/client'
import { FeuHumainImporter } from './import-feu-humain'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log("🔥 Réinitialisation et réimport de l'archive FEU HUMAIN")
  console.log('=========================================================\n')

  try {
    // 1. Vérifier si l'archive existe
    const existingArchive = await prisma.conversationArchive.findUnique({
      where: { slug: 'feu-humain' },
      include: {
        _count: {
          select: {
            messages: true,
            participants: true,
          },
        },
      },
    })

    if (existingArchive) {
      console.log('📊 Archive existante trouvée:')
      console.log(`   - Titre: ${existingArchive.title}`)
      console.log(`   - Messages: ${existingArchive._count.messages}`)
      console.log(`   - Participants: ${existingArchive._count.participants}`)
      console.log('')

      // 2. Supprimer l'archive (cascade supprimera messages, participants, réactions, médias)
      console.log("🗑️  Suppression de l'archive existante...")
      await prisma.conversationArchive.delete({
        where: { slug: 'feu-humain' },
      })
      console.log(
        '✅ Archive supprimée (avec tous ses messages, participants, réactions, médias)\n'
      )
    } else {
      console.log('ℹ️  Aucune archive existante trouvée\n')
    }

    // 3. Vérifier que le fichier JSON existe
    const jsonPath = path.join(process.cwd(), 'public', 'FEU HUMAIN', 'message_1.json')
    console.log('📂 Vérification du fichier source...')
    console.log(`   Chemin: ${jsonPath}`)

    // 4. Réimporter avec le nouveau code (qui nettoie l'encodage)
    console.log("\n🔄 Démarrage du réimport avec nettoyage d'encodage...\n")
    const importer = new FeuHumainImporter()
    await importer.import(jsonPath)

    console.log('\n✨ Réimport terminé avec succès !')
    console.log('   Les données sont maintenant correctement encodées.')
  } catch (error) {
    console.error('\n❌ Erreur:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Erreur fatale:', error)
    process.exit(1)
  })
}

export { main as reimportFeuHumain }
