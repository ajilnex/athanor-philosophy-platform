import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Configuration pour accepter des fichiers volumineux
export const maxDuration = 300 // 5 minutes au lieu de 60 secondes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // Utiliser Node.js runtime pour plus de stabilité

interface MessengerMessage {
  sender_name: string
  timestamp_ms: number
  content?: string
  photos?: Array<{ uri: string; creation_timestamp?: number }>
  videos?: Array<{ uri: string; thumbnail?: { uri: string } }>
  audio_files?: Array<{ uri: string }>
  gifs?: Array<{ uri: string }>
  files?: Array<{ uri: string }>
  reactions?: Array<{ reaction: string; actor: string }>
  type?: string
}

interface MessengerExport {
  participants: Array<{ name: string }>
  messages: MessengerMessage[]
  title: string
  is_still_participant?: boolean
  thread_type?: string
  thread_path?: string
}

export async function POST(request: NextRequest) {
  console.log('\n========== FEU HUMAIN IMPORT API ==========')
  console.log('Request received at:', new Date().toISOString())

  try {
    // Vérifier l'authentification admin
    const session = await getServerSession(authOptions)
    console.log('Session user:', session?.user)

    if (!session || (session.user as any).role !== 'ADMIN') {
      console.error('Authentication failed - not admin')
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = formData.get('mode') as string
    const importMode = formData.get('importMode') as string

    console.log('Request details:')
    console.log('- Mode:', mode)
    console.log('- Import Mode:', importMode)
    console.log('- File name:', file?.name)
    console.log('- File size:', file?.size, 'bytes')

    if (!file) {
      console.error('No file provided')
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Parser le fichier JSON
    console.log('Parsing JSON file...')
    const text = await file.text()
    const data: MessengerExport = JSON.parse(text)
    console.log('JSON parsed successfully')
    console.log('- Messages count:', data.messages?.length)
    console.log('- Participants:', data.participants?.length)

    // Mode analyse : retourner les statistiques sans importer
    if (mode === 'analyze') {
      return await analyzeFile(data)
    }

    // Mode import : importer les données
    if (mode === 'import') {
      return await importData(data, importMode)
    }

    return NextResponse.json({ error: 'Mode invalide' }, { status: 400 })
  } catch (error) {
    console.error("Erreur dans l'API FEU HUMAIN:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du traitement' },
      { status: 500 }
    )
  }
}

async function analyzeFile(data: MessengerExport) {
  try {
    // Vérifier si l'archive existe
    const existingArchive = await prisma.conversationArchive.findUnique({
      where: { slug: 'feu-humain' },
      include: {
        messages: {
          select: { timestamp: true },
        },
      },
    })

    // Récupérer tous les timestamps existants pour détection des doublons
    const existingTimestamps = new Set(
      existingArchive?.messages.map(m => m.timestamp.toString()) || []
    )

    // Analyser les messages du fichier
    const fileTimestamps = data.messages.map(m => m.timestamp_ms)
    const newMessages = data.messages.filter(
      m => !existingTimestamps.has(m.timestamp_ms.toString())
    )

    // Calculer les dates
    const startDate = new Date(Math.min(...fileTimestamps))
    const endDate = new Date(Math.max(...fileTimestamps))

    // Récupérer les participants uniques
    const participants = new Set(data.messages.map(m => m.sender_name))

    return NextResponse.json({
      existingArchive: !!existingArchive,
      totalMessagesInFile: data.messages.length,
      existingMessages: data.messages.length - newMessages.length,
      newMessages: newMessages.length,
      participants: participants.size,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    })
  } catch (error) {
    console.error("Erreur lors de l'analyse:", error)
    return NextResponse.json({ error: "Erreur lors de l'analyse du fichier" }, { status: 500 })
  }
}

async function importData(data: MessengerExport, importMode: string) {
  try {
    // Vérifier ou créer l'archive
    let archive = await prisma.conversationArchive.findUnique({
      where: { slug: 'feu-humain' },
      include: {
        participants: true,
        messages: {
          select: { timestamp: true },
        },
      },
    })

    if (!archive) {
      // Créer une nouvelle archive
      const timestamps = data.messages.map(m => m.timestamp_ms)
      const startDate = new Date(Math.min(...timestamps))
      const endDate = new Date(Math.max(...timestamps))

      archive = await prisma.conversationArchive.create({
        data: {
          title: data.title || 'FEU HUMAIN',
          slug: 'feu-humain',
          description: 'Archive de la conversation légendaire',
          isPublic: false,
          startDate,
          endDate,
          metadata: {
            threadType: data.thread_type,
            threadPath: data.thread_path,
            isStillParticipant: data.is_still_participant,
          },
        },
        include: {
          participants: true,
          messages: {
            select: { timestamp: true },
          },
        },
      })
    }

    // Créer un set des timestamps existants pour éviter les doublons
    const existingTimestamps = new Set(archive.messages.map(m => m.timestamp.toString()))

    // Créer un map des participants existants
    const participantsMap = new Map<string, string>()
    archive.participants.forEach(p => {
      participantsMap.set(p.name, p.id)
    })

    // Créer les nouveaux participants si nécessaire
    const allParticipantNames = new Set(data.messages.map(m => m.sender_name))
    for (const name of allParticipantNames) {
      if (!participantsMap.has(name)) {
        const participant = await prisma.conversationParticipant.create({
          data: {
            archiveId: archive.id,
            name,
            messageCount: 0,
          },
        })
        participantsMap.set(name, participant.id)
      }
    }

    // Filtrer les nouveaux messages uniquement
    const newMessages = data.messages.filter(
      m => !existingTimestamps.has(m.timestamp_ms.toString())
    )

    if (newMessages.length === 0) {
      return NextResponse.json({
        success: true,
        importedMessages: 0,
        message: 'Aucun nouveau message à importer',
      })
    }

    // Importer les messages par lots de 100
    const BATCH_SIZE = 100
    let importedCount = 0

    for (let i = 0; i < newMessages.length; i += BATCH_SIZE) {
      const batch = newMessages.slice(i, i + BATCH_SIZE)

      await prisma.$transaction(async tx => {
        for (const msg of batch) {
          const participantId = participantsMap.get(msg.sender_name)

          // Créer le message
          const message = await tx.conversationMessage.create({
            data: {
              archiveId: archive.id,
              participantId: participantId || null,
              senderName: msg.sender_name,
              content: msg.content || null,
              timestamp: msg.timestamp_ms,
              timestampDate: new Date(msg.timestamp_ms),
              messageType: msg.type || 'text',
              metadata: {
                originalType: msg.type,
              },
            },
          })

          // Ajouter les médias
          const mediaToCreate = []

          if (msg.photos?.length) {
            mediaToCreate.push(
              ...msg.photos.map(photo => ({
                messageId: message.id,
                type: 'photo',
                originalUri: photo.uri,
                fileName: photo.uri.split('/').pop() || 'photo',
              }))
            )
          }

          if (msg.videos?.length) {
            mediaToCreate.push(
              ...msg.videos.map(video => ({
                messageId: message.id,
                type: 'video',
                originalUri: video.uri,
                fileName: video.uri.split('/').pop() || 'video',
                thumbnailUrl: video.thumbnail?.uri,
              }))
            )
          }

          if (msg.audio_files?.length) {
            mediaToCreate.push(
              ...msg.audio_files.map(audio => ({
                messageId: message.id,
                type: 'audio',
                originalUri: audio.uri,
                fileName: audio.uri.split('/').pop() || 'audio',
              }))
            )
          }

          if (msg.gifs?.length) {
            mediaToCreate.push(
              ...msg.gifs.map(gif => ({
                messageId: message.id,
                type: 'gif',
                originalUri: gif.uri,
                fileName: gif.uri.split('/').pop() || 'gif',
              }))
            )
          }

          if (msg.files?.length) {
            mediaToCreate.push(
              ...msg.files.map(file => ({
                messageId: message.id,
                type: 'file',
                originalUri: file.uri,
                fileName: file.uri.split('/').pop() || 'file',
              }))
            )
          }

          if (mediaToCreate.length > 0) {
            await tx.conversationMedia.createMany({
              data: mediaToCreate,
            })
          }

          // Ajouter les réactions
          if (msg.reactions?.length) {
            await tx.conversationReaction.createMany({
              data: msg.reactions.map(reaction => ({
                messageId: message.id,
                participantId: participantsMap.get(reaction.actor) || null,
                actorName: reaction.actor,
                reaction: reaction.reaction,
              })),
            })
          }
        }
      })

      importedCount += batch.length
      console.log(`Importé ${importedCount}/${newMessages.length} messages`)
    }

    // Mettre à jour les statistiques des participants
    for (const [name, participantId] of participantsMap) {
      const stats = await prisma.conversationMessage.aggregate({
        where: {
          archiveId: archive.id,
          participantId,
        },
        _count: true,
        _min: { timestampDate: true },
        _max: { timestampDate: true },
      })

      await prisma.conversationParticipant.update({
        where: { id: participantId },
        data: {
          messageCount: stats._count,
          firstMessageAt: stats._min.timestampDate,
          lastMessageAt: stats._max.timestampDate,
        },
      })
    }

    // Mettre à jour les dates de l'archive si nécessaire
    const allTimestamps = [...data.messages.map(m => m.timestamp_ms)]
    const newStartDate = new Date(Math.min(...allTimestamps))
    const newEndDate = new Date(Math.max(...allTimestamps))

    await prisma.conversationArchive.update({
      where: { id: archive.id },
      data: {
        startDate:
          archive.startDate && archive.startDate < newStartDate ? archive.startDate : newStartDate,
        endDate: archive.endDate && archive.endDate > newEndDate ? archive.endDate : newEndDate,
        messageCount: await prisma.conversationMessage.count({
          where: { archiveId: archive.id },
        }),
        participantCount: participantsMap.size,
      },
    })

    return NextResponse.json({
      success: true,
      archiveId: archive.id,
      slug: archive.slug,
      importedMessages: importedCount,
      totalMessages: await prisma.conversationMessage.count({
        where: { archiveId: archive.id },
      }),
    })
  } catch (error) {
    console.error("Erreur lors de l'import:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'import" },
      { status: 500 }
    )
  }
}
