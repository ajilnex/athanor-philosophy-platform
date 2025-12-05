import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/archive/[slug] - Récupérer les infos de l'archive
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // Await the params since they're now a Promise in Next.js 15
    const { slug } = await params

    // Vérifier l'authentification pour les archives privées
    const session = await getServerSession(authOptions)

    const archive = await prisma.conversationArchive.findUnique({
      where: { slug: slug },
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
    let photoCount = 0
    let videoCount = 0
    let audioCount = 0
    let reactionCount = 0
    let timelineDistribution: any[] = []
    let hourlyDistribution: any[] = []

    try {
      const statsResults = await Promise.all([
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
        // Aggregate messages by day for waveform overview
        prisma.$queryRaw`
          SELECT 
            TO_CHAR("timestampDate", 'YYYY-MM-DD') as date,
            CAST(COUNT(*) AS INTEGER) as count
          FROM "ConversationMessage"
          WHERE "archiveId" = ${archive.id}
          GROUP BY TO_CHAR("timestampDate", 'YYYY-MM-DD')
          ORDER BY date ASC
        `,
        // Aggregate messages by HOUR for minute-level precision
        // Returns timestamps at hour granularity with message count
        prisma.$queryRaw`
          SELECT 
            TO_CHAR("timestampDate", 'YYYY-MM-DD"T"HH24:00:00') as timestamp,
            CAST(COUNT(*) AS INTEGER) as count,
            MIN("timestamp") as first_msg,
            MAX("timestamp") as last_msg
          FROM "ConversationMessage"
          WHERE "archiveId" = ${archive.id}
          GROUP BY TO_CHAR("timestampDate", 'YYYY-MM-DD"T"HH24:00:00')
          ORDER BY timestamp ASC
        `,
        // Get first and last activity date for each participant + reaction count
        prisma.$queryRaw`
          SELECT 
            p.id,
            p.name,
            p."messageCount",
            COALESCE((
              SELECT COUNT(*) FROM "ConversationReaction" r 
              WHERE r."actorName" = p.name 
              AND r."messageId" IN (SELECT id FROM "ConversationMessage" WHERE "archiveId" = ${archive.id})
            ), 0) as reaction_count,
            MIN(m."timestampDate") as first_activity,
            MAX(m."timestampDate") as last_activity
          FROM "ConversationParticipant" p
          LEFT JOIN "ConversationMessage" m ON m."participantId" = p.id
          WHERE p."archiveId" = ${archive.id}
          GROUP BY p.id, p.name, p."messageCount"
          ORDER BY p."messageCount" DESC
        `
      ])

      photoCount = statsResults[0]
      videoCount = statsResults[1]
      audioCount = statsResults[2]
      reactionCount = statsResults[3]

      // Convert BigInt to Number for JSON serialization (PostgreSQL raw queries return BigInt)
      timelineDistribution = (statsResults[4] as any[]).map(item => ({
        date: item.date,
        count: Number(item.count)
      }))
      hourlyDistribution = (statsResults[5] as any[]).map(item => ({
        timestamp: item.timestamp,
        count: Number(item.count),
        first_msg: item.first_msg?.toString(),
        last_msg: item.last_msg?.toString()
      }))

      // Process participant activity data
      const participantActivity = (statsResults[6] as any[]).map(p => ({
        id: p.id,
        name: p.name,
        messageCount: Number(p.messageCount),
        reactionCount: Number(p.reaction_count || 0),
        firstActivity: p.first_activity ? new Date(p.first_activity).toISOString() : null,
        lastActivity: p.last_activity ? new Date(p.last_activity).toISOString() : null,
      }))

      // Determine "departed" participants: those whose last activity is > 1 year before archive end
      const archiveEndDate = archive.endDate ? new Date(archive.endDate) : new Date()
      const oneYearBeforeEnd = new Date(archiveEndDate)
      oneYearBeforeEnd.setFullYear(oneYearBeforeEnd.getFullYear() - 1)

      const participantsWithStatus = participantActivity.map(p => ({
        ...p,
        isDeparted: p.lastActivity ? new Date(p.lastActivity) < oneYearBeforeEnd : false
      }))

      return NextResponse.json({
        id: archive.id,
        title: archive.title,
        slug: archive.slug,
        description: archive.description,
        participants: participantsWithStatus,
        stats: {
          totalMessages: archive._count.messages,
          participantCount: archive.participants.length,
          photos: photoCount,
          videos: videoCount,
          audio: audioCount,
          reactions: reactionCount,
          startDate: archive.startDate,
          endDate: archive.endDate,
          timelineDistribution,
          hourlyDistribution,
        },
      })
    } catch (statsError) {
      console.error('Erreur calcul stats:', statsError)
      // Continue without stats if they fail - return basic data
      return NextResponse.json({
        id: archive.id,
        title: archive.title,
        slug: archive.slug,
        description: archive.description,
        participants: archive.participants,
        departedParticipants: [],
        stats: {
          totalMessages: archive._count.messages,
          participantCount: archive.participants.length,
          photos: 0,
          videos: 0,
          audio: 0,
          reactions: 0,
          startDate: archive.startDate,
          endDate: archive.endDate,
          timelineDistribution: [],
          hourlyDistribution: [],
        },
      })
    }
  } catch (error) {
    console.error('Erreur API archive:', error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'archive" },
      { status: 500 }
    )
  }
}
