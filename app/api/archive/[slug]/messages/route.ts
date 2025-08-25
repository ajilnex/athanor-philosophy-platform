import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/archive/[slug]/messages?page=1&limit=50&search=...&filter=...
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 par page
    const search = searchParams.get('search') || ''
    const filterType = searchParams.get('filter') || 'all'
    const participantId = searchParams.get('participant') || undefined

    // Vérifier que l'archive existe
    const archive = await prisma.conversationArchive.findUnique({
      where: { slug: slug },
      select: { id: true, isPublic: true },
    })

    if (!archive) {
      return NextResponse.json({ error: 'Archive non trouvée' }, { status: 404 })
    }

    // Construire les conditions de recherche
    const where: any = { archiveId: archive.id }

    // Filtre par participant
    if (participantId) {
      where.participantId = participantId
    }

    // Recherche textuelle
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filtre par type de contenu
    if (filterType !== 'all') {
      switch (filterType) {
        case 'text':
          where.content = { not: null }
          where.media = { none: {} }
          break
        case 'photos':
          where.media = { some: { type: 'photo' } }
          break
        case 'videos':
          where.media = { some: { type: 'video' } }
          break
        case 'audio':
          where.media = { some: { type: 'audio' } }
          break
      }
    }

    // Pagination et requête
    const [messages, totalCount] = await Promise.all([
      prisma.conversationMessage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'asc' },
        include: {
          media: {
            select: {
              id: true,
              type: true,
              cloudinaryUrl: true,
              thumbnailUrl: true,
              fileName: true,
            },
          },
          reactions: {
            select: {
              id: true,
              reaction: true,
              actorName: true,
            },
          },
          participant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.conversationMessage.count({ where }),
    ])

    // Formater les réponses pour optimiser la taille
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      sender: msg.senderName,
      content: msg.content,
      timestamp: msg.timestamp.toString(),
      date: msg.timestampDate.toISOString(),
      media: msg.media.map(m => ({
        id: m.id,
        type: m.type,
        url: m.cloudinaryUrl || `/api/archive/${slug}/media/${m.id}`,
        thumb: m.thumbnailUrl,
        name: m.fileName,
      })),
      reactions: msg.reactions.map(r => ({
        reaction: r.reaction,
        actor: r.actorName,
      })),
    }))

    return NextResponse.json({
      messages: formattedMessages,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Erreur API messages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    )
  }
}
