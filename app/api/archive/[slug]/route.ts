import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/archive/[slug] - Récupérer les infos de l'archive
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    // Vérifier l'authentification pour les archives privées
    const session = await getServerSession(authOptions)

    const archive = await prisma.conversationArchive.findUnique({
      where: { slug: params.slug },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            messageCount: true,
          },
          orderBy: { messageCount: 'desc' },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    if (!archive) {
      return NextResponse.json({ error: 'Archive non trouvée' }, { status: 404 })
    }

    // Vérifier l'accès si archive privée
    if (!archive.isPublic && !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Si admin seulement
    if (!archive.isPublic && session?.user && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer les statistiques supplémentaires
    const [photoCount, videoCount, audioCount, reactionCount] = await Promise.all([
      prisma.conversationMedia.count({
        where: {
          message: { archiveId: archive.id },
          type: 'photo',
        },
      }),
      prisma.conversationMedia.count({
        where: {
          message: { archiveId: archive.id },
          type: 'video',
        },
      }),
      prisma.conversationMedia.count({
        where: {
          message: { archiveId: archive.id },
          type: 'audio',
        },
      }),
      prisma.conversationReaction.count({
        where: {
          message: { archiveId: archive.id },
        },
      }),
    ])

    return NextResponse.json({
      id: archive.id,
      title: archive.title,
      slug: archive.slug,
      description: archive.description,
      participants: archive.participants,
      stats: {
        totalMessages: archive._count.messages,
        participantCount: archive.participants.length,
        photos: photoCount,
        videos: videoCount,
        audio: audioCount,
        reactions: reactionCount,
        startDate: archive.startDate,
        endDate: archive.endDate,
      },
    })
  } catch (error) {
    console.error('Erreur API archive:', error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'archive" },
      { status: 500 }
    )
  }
}
