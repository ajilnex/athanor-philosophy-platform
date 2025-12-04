/**
 * Script de migration pour nettoyer l'encodage des données existantes
 * dans la base de données Feu Humain
 *
 * Usage: npx dotenv-cli -e .env.local -- tsx scripts/fix-existing-encoding.ts
 */

import { PrismaClient } from '@prisma/client'
import { cleanString } from './encoding-utils'

const prisma = new PrismaClient()

async function main() {
  console.log("🔧 Migration: Nettoyage de l'encodage des données existantes")
  console.log('=============================================================\n')

  try {
    // Récupérer l'archive Feu Humain
    const archive = await prisma.conversationArchive.findUnique({
      where: { slug: 'feu-humain' },
      include: {
        participants: true,
        messages: {
          include: {
            reactions: true,
          },
        },
      },
    })

    if (!archive) {
      console.log('❌ Archive "feu-humain" non trouvée')
      console.log('   Rien à migrer.')
      return
    }

    console.log(`✅ Archive trouvée: ${archive.title}`)
    console.log(`   - ${archive.messageCount} messages`)
    console.log(`   - ${archive.participantCount} participants\n`)

    // Nettoyer les participants
    console.log('👥 Nettoyage des participants...')
    let participantsUpdated = 0
    for (const participant of archive.participants) {
      const cleanedName = cleanString(participant.name)
      if (cleanedName && cleanedName !== participant.name) {
        await prisma.conversationParticipant.update({
          where: { id: participant.id },
          data: { name: cleanedName },
        })
        participantsUpdated++
        console.log(`   ✓ ${participant.name} → ${cleanedName}`)
      }
    }
    console.log(`✅ ${participantsUpdated} participants mis à jour\n`)

    // Nettoyer les messages par lots
    console.log('💬 Nettoyage des messages...')
    const BATCH_SIZE = 100
    let messagesUpdated = 0
    let reactionsUpdated = 0

    for (let i = 0; i < archive.messages.length; i += BATCH_SIZE) {
      const batch = archive.messages.slice(i, i + BATCH_SIZE)

      for (const message of batch) {
        const updates: any = {}
        let needsUpdate = false

        // Nettoyer le contenu
        if (message.content) {
          const cleanedContent = cleanString(message.content)
          if (cleanedContent && cleanedContent !== message.content) {
            updates.content = cleanedContent
            needsUpdate = true
          }
        }

        // Nettoyer le nom de l'expéditeur
        const cleanedSenderName = cleanString(message.senderName)
        if (cleanedSenderName && cleanedSenderName !== message.senderName) {
          updates.senderName = cleanedSenderName
          needsUpdate = true
        }

        // Mettre à jour le message si nécessaire
        if (needsUpdate) {
          await prisma.conversationMessage.update({
            where: { id: message.id },
            data: updates,
          })
          messagesUpdated++
        }

        // Nettoyer les réactions
        for (const reaction of message.reactions) {
          const reactionUpdates: any = {}
          let reactionNeedsUpdate = false

          const cleanedActorName = cleanString(reaction.actorName)
          if (cleanedActorName && cleanedActorName !== reaction.actorName) {
            reactionUpdates.actorName = cleanedActorName
            reactionNeedsUpdate = true
          }

          const cleanedReaction = cleanString(reaction.reaction)
          if (cleanedReaction && cleanedReaction !== reaction.reaction) {
            reactionUpdates.reaction = cleanedReaction
            reactionNeedsUpdate = true
          }

          if (reactionNeedsUpdate) {
            await prisma.conversationReaction.update({
              where: { id: reaction.id },
              data: reactionUpdates,
            })
            reactionsUpdated++
          }
        }
      }

      // Afficher la progression
      const progress = Math.min(i + BATCH_SIZE, archive.messages.length)
      const percent = ((progress / archive.messages.length) * 100).toFixed(1)
      console.log(`   📥 ${progress}/${archive.messages.length} messages traités (${percent}%)`)
    }

    console.log(`\n✅ Migration terminée !`)
    console.log(`   - ${messagesUpdated} messages mis à jour`)
    console.log(`   - ${reactionsUpdated} réactions mises à jour`)
    console.log(`   - ${participantsUpdated} participants mis à jour`)
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
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

export { main as fixExistingEncoding }
