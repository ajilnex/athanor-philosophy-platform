/**
 * Script d'import de l'archive FEU HUMAIN dans PostgreSQL
 * Optimisé pour Vercel et production
 *
 * Usage: npm run import:feu-humain
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

const prisma = new PrismaClient()

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface MessengerExport {
  participants: Array<{ name: string }>
  messages: Array<{
    sender_name: string
    timestamp_ms: number
    content?: string
    photos?: Array<{ uri: string; creation_timestamp?: number }>
    videos?: Array<{ uri: string; thumbnail?: { uri: string } }>
    audio_files?: Array<{ uri: string }>
    reactions?: Array<{ reaction: string; actor: string }>
    type?: string
  }>
  title: string
  is_still_participant?: boolean
  thread_type?: string
  thread_path?: string
}

// Table de conversion pour corriger le double encodage UTF-8
const ENCODING_FIXES: Record<string, string> = {
  // Lettres accentuées minuscules
  'Ã©': 'é',
  'Ã¨': 'è',
  'Ã ': 'à',
  'Ã¢': 'â',
  'Ã§': 'ç',
  'Ã´': 'ô',
  'Ã®': 'î',
  'Ã¯': 'ï',
  'Ã«': 'ë',
  'Ã¹': 'ù',
  'Ã»': 'û',
  'Ã¼': 'ü',
  'Ã¶': 'ö',
  'Ã±': 'ñ',

  // Lettres accentuées majuscules
  'Ã€': 'À',
  'Ã‰': 'É',
  ÃŠ: 'Ê',
  'Ã‹': 'Ë',
  ÃŒ: 'Ì',
  ÃŽ: 'Î',
  'Ã\u2019': 'Ò',
  'Ã"': 'Ô',
  'Ã–': 'Ö',
  'Ã™': 'Ù',
  Ãš: 'Ú',
  'Ã›': 'Û',
  Ãœ: 'Ü',
  'Ã‡': 'Ç',

  // Ligatures et symboles
  'Å"': 'œ',
  "Å'": 'Œ',
  'Ã¦': 'æ',
  'Ã†': 'Æ',
  'â€™': "'",
  'â€˜': "'",
  'â€œ': '"',
  'â€': '"',
  'â€"': '—',
  'â€¦': '...',
  'â€¢': '•',
  'â„¢': '™',
  'Â©': '©',
  'Â®': '®',
  'â€°': '‰',
  'â€¹': '‹',
  'â€º': '›',
  'Â«': '«',
  'Â»': '»',
  'Â ': ' ',
  'Ã—': '×',
  'Ã·': '÷',
  'Â°': '°',
  'â‚¬': '€',
  'Â£': '£',
  'Â¥': '¥',
  'Â§': '§',
  'Â¶': '¶',
  'nÂ°': 'n°',
}

function cleanString(str: string | null | undefined): string | null | undefined {
  if (!str) return str
  let cleaned = str
  for (const [bad, good] of Object.entries(ENCODING_FIXES)) {
    const regex = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    cleaned = cleaned.replace(regex, good)
  }
  // Fix double spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ')
  return cleaned.trim()
}

class FeuHumainImporter {
  private batchSize = 5 // Réduit encore plus pour la prod (latence réseau)
  private uploadToCloudinary = true // Activé pour la production

  async import(jsonPath: string): Promise<void> {
    console.log('🔥 Import FEU HUMAIN dans PostgreSQL')
    console.log('=====================================\n')

    try {
      // 1. Charger le JSON
      console.log('📖 Chargement du fichier JSON...')
      const rawData = await fs.readFile(jsonPath, 'utf-8')
      const data: MessengerExport = JSON.parse(rawData)
      console.log(`✅ ${data.messages.length} messages chargés`)

      // 2. Créer l'archive
      console.log("\n📦 Création de l'archive...")
      const archive = await this.createArchive(data)
      console.log(`✅ Archive créée: ${archive.slug}`)

      // 3. Créer les participants
      console.log('\n👥 Import des participants...')
      const participantsMap = await this.importParticipants(archive.id, data)
      console.log(`✅ ${participantsMap.size} participants importés`)

      // 4. Importer les messages par lots
      console.log('\n💬 Import des messages...')
      await this.importMessages(archive.id, data, participantsMap)

      // 5. Mettre à jour les statistiques
      console.log('\n📊 Mise à jour des statistiques...')
      await this.updateStatistics(archive.id)

      console.log('\n✨ Import terminé avec succès!')
      console.log(`🔗 Accès: /admin/feu-humain/${archive.slug}`)
    } catch (error) {
      console.error("❌ Erreur lors de l'import:", error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async createArchive(data: MessengerExport) {
    const timestamps = data.messages.map(m => m.timestamp_ms)
    const startDate = new Date(Math.min(...timestamps))
    const endDate = new Date(Math.max(...timestamps))

    return await prisma.conversationArchive.create({
      data: {
        title: data.title || 'FEU HUMAIN',
        slug: 'feu-humain',
        description: 'Archive de la conversation légendaire',
        threadType: data.thread_type,
        participantCount: data.participants.length,
        messageCount: data.messages.length,
        startDate,
        endDate,
        metadata: {
          originalPath: data.thread_path,
          isStillParticipant: data.is_still_participant,
        },
        isPublic: false, // Protégé par défaut
      },
    })
  }

  private async importParticipants(
    archiveId: string,
    data: MessengerExport
  ): Promise<Map<string, string>> {
    const participantsMap = new Map<string, string>()

    // Créer tous les participants
    for (const participant of data.participants) {
      const created = await prisma.conversationParticipant.create({
        data: {
          archiveId,
          name: participant.name,
          messageCount: 0,
        },
      })
      participantsMap.set(participant.name, created.id)
    }

    // Calculer les stats par participant
    const stats = new Map<string, { count: number; first: number; last: number }>()

    for (const message of data.messages) {
      const current = stats.get(message.sender_name) || {
        count: 0,
        first: message.timestamp_ms,
        last: message.timestamp_ms,
      }

      current.count++
      current.first = Math.min(current.first, message.timestamp_ms)
      current.last = Math.max(current.last, message.timestamp_ms)

      stats.set(message.sender_name, current)
    }

    // Mettre à jour les stats
    for (const [name, id] of participantsMap) {
      const stat = stats.get(name)
      if (stat) {
        await prisma.conversationParticipant.update({
          where: { id },
          data: {
            messageCount: stat.count,
            firstMessageAt: new Date(stat.first),
            lastMessageAt: new Date(stat.last),
          },
        })
      }
    }

    return participantsMap
  }

  private async importMessages(
    archiveId: string,
    data: MessengerExport,
    participantsMap: Map<string, string>
  ): Promise<void> {
    const totalMessages = data.messages.length
    let imported = 0

    // Trier par timestamp pour garder l'ordre chronologique
    const sortedMessages = [...data.messages].sort((a, b) => a.timestamp_ms - b.timestamp_ms)

    // Traiter par lots
    for (let i = 0; i < sortedMessages.length; i += this.batchSize) {
      const batch = sortedMessages.slice(i, i + this.batchSize)

      await prisma.$transaction(
        async tx => {
          for (const msg of batch) {
            // Créer le message
            const content = cleanString(msg.content)
            const senderName = cleanString(msg.sender_name) || 'Inconnu'
            const message = await tx.conversationMessage.create({
              data: {
                archiveId,
                participantId: participantsMap.get(msg.sender_name) || null,
                senderName: senderName,
                content: content || null,
                timestamp: msg.timestamp_ms,
                timestampDate: new Date(msg.timestamp_ms),
                messageType: msg.type || 'text',
                metadata: {
                  originalType: msg.type,
                },
              },
            })

            // Ajouter les médias
            if (msg.photos && msg.photos.length > 0) {
              for (const photo of msg.photos) {
                await this.createMedia(tx, message.id, 'photo', photo.uri)
              }
            }

            if (msg.videos && msg.videos.length > 0) {
              for (const video of msg.videos) {
                await this.createMedia(tx, message.id, 'video', video.uri, video.thumbnail?.uri)
              }
            }

            if (msg.audio_files && msg.audio_files.length > 0) {
              for (const audio of msg.audio_files) {
                await this.createMedia(tx, message.id, 'audio', audio.uri)
              }
            }

            // Ajouter les réactions
            if (msg.reactions && msg.reactions.length > 0) {
              for (const reaction of msg.reactions) {
                await tx.conversationReaction.create({
                  data: {
                    messageId: message.id,
                    participantId: participantsMap.get(reaction.actor) || null,
                    actorName: cleanString(reaction.actor) || 'Inconnu',
                    reaction: cleanString(reaction.reaction) || '❤️',
                  },
                })
              }
            }
          }
        },
        {
          maxWait: 20000,
          timeout: 120000,
        }
      )

      imported += batch.length
      console.log(
        `  📥 ${imported}/${totalMessages} messages importés (${Math.round((imported / totalMessages) * 100)}%)`
      )
    }
  }

  private async createMedia(
    tx: any,
    messageId: string,
    type: string,
    originalUri: string,
    thumbnailUri?: string
  ) {
    // Nettoyer le chemin de l'URI pour qu'il soit relatif à `public/FEU HUMAIN`
    // Nettoyer le chemin de l'URI
    let cleanUri = originalUri

    // Si c'est une URI absolue locale (commence par /Users/...), on essaie de garder la partie relative
    if (cleanUri.includes('/FEU HUMAIN/')) {
      cleanUri = cleanUri.substring(cleanUri.indexOf('/FEU HUMAIN/'))
    } else {
      // Fallback: chercher les dossiers connus
      const mediaFolders = ['photos/', 'videos/', 'audio_files/', 'audio/', 'gifs/', 'files/']
      for (const folder of mediaFolders) {
        const index = originalUri.indexOf(folder)
        if (index !== -1) {
          // On ajoute le préfixe si manquant
          cleanUri = '/FEU HUMAIN/' + originalUri.substring(index)
          break
        }
      }
    }

    const fileName = path.basename(cleanUri)

    let cloudinaryUrl = null
    let cloudinaryPublicId = null
    let thumbnailUrl = null

    // Upload vers Cloudinary (désactivé par défaut pour les tests)
    if (this.uploadToCloudinary) {
      try {
        // Construction du chemin absolu correct
        // cleanUri commence par /FEU HUMAIN/...
        const localPath = path.join(process.cwd(), 'public', cleanUri)

        // Vérifier si le fichier existe localement
        await fs.access(localPath)

        // Mapper le type local au resource_type de Cloudinary
        let resource_type: 'image' | 'video' | 'raw' = 'image'
        if (type === 'video' || type === 'audio') {
          resource_type = 'video'
        } else if (type === 'file') {
          resource_type = 'raw'
        }

        // Upload selon le type
        const uploadOptions = {
          folder: 'feu-humain',
          resource_type: resource_type,
          public_id: `${type}_${messageId}_${Date.now()}`,
        }

        const result = await cloudinary.uploader.upload(localPath, uploadOptions)

        cloudinaryUrl = result.secure_url
        cloudinaryPublicId = result.public_id

        // Générer thumbnail pour vidéos
        if (type === 'video' && !thumbnailUri) {
          thumbnailUrl = cloudinary.url(result.public_id, {
            resource_type: 'video',
            transformation: [{ width: 400, height: 300, crop: 'fill' }, { format: 'jpg' }],
          })
        }
      } catch (error) {
        console.warn(`  ⚠️ Impossible d'uploader ${fileName}:`, error)
      }
    }

    await tx.conversationMedia.create({
      data: {
        messageId,
        type,
        originalUri: cleanUri, // Utiliser l'URI nettoyée
        cloudinaryUrl,
        cloudinaryPublicId,
        thumbnailUrl,
        fileName,
      },
    })
  }

  private async updateStatistics(archiveId: string) {
    const [messageCount, participantCount] = await Promise.all([
      prisma.conversationMessage.count({ where: { archiveId } }),
      prisma.conversationParticipant.count({ where: { archiveId } }),
    ])

    await prisma.conversationArchive.update({
      where: { id: archiveId },
      data: { messageCount, participantCount },
    })
  }
}

// Exécution
async function main() {
  const importer = new FeuHumainImporter()
  const jsonPath = './public/FEU HUMAIN/message_1.json'

  try {
    await importer.import(jsonPath)
  } catch (error) {
    console.error('Erreur fatale:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { FeuHumainImporter }
