/**
 * Script pour vérifier l'encodage dans la base de données
 * Affiche quelques messages pour voir si l'encodage est correct
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("🔍 Vérification de l'encodage dans la base de données\n")

  try {
    // Récupérer quelques messages
    const messages = await prisma.conversationMessage.findMany({
      where: {
        archive: {
          slug: 'feu-humain',
        },
        content: {
          not: null,
        },
      },
      take: 20,
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        id: true,
        senderName: true,
        content: true,
        timestamp: true,
      },
    })

    console.log(`📊 ${messages.length} messages récupérés\n`)

    for (const msg of messages) {
      console.log('─'.repeat(80))
      console.log(`👤 ${msg.senderName}`)
      console.log(`📅 ${new Date(Number(msg.timestamp)).toLocaleString('fr-FR')}`)
      console.log(`💬 ${msg.content}`)

      // Vérifier si le contenu contient des caractères problématiques
      if (msg.content?.includes('�')) {
        console.log('❌ CONTIENT DES CARACTÈRES INVALIDES (�)')
      }
      if (
        msg.content?.includes('Ã©') ||
        msg.content?.includes('Ã¨') ||
        msg.content?.includes('Ã ')
      ) {
        console.log('❌ CONTIENT DU MOJIBAKE (Ã©, Ã¨, Ã )')
      }

      console.log('')
    }

    console.log('─'.repeat(80))
    console.log('\n✅ Vérification terminée')
  } catch (error) {
    console.error('❌ Erreur:', error)
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

export { main as checkEncoding }
