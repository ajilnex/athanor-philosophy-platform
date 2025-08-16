import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validation pour les commentaires
const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  targetType: z.enum(['billet', 'publication']),
  targetId: z.string(),
  parentId: z.string().optional(),
})

const querySchema = z.object({
  targetType: z.enum(['billet', 'publication']),
  targetId: z.string(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
})

// GET - Récupérer les commentaires
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      targetType: searchParams.get('targetType'),
      targetId: searchParams.get('targetId'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    const session = await getServerSession(authOptions)
    const isAdmin = (session?.user as any)?.role === 'ADMIN'
    const currentUserId = (session?.user as any)?.id

    // Pagination
    const skip = (query.page - 1) * query.limit

    // Conditions de visibilité :
    // - Admin : voit tout
    // - Auteur : voit ses propres commentaires même non approuvés
    // - Public : seulement les commentaires approuvés et visibles
    const whereConditions: any = {
      targetType: query.targetType,
      targetId: query.targetId,
      parentId: null, // Seulement les commentaires racine
      isVisible: true,
    }

    if (!isAdmin) {
      whereConditions.OR = [
        { isApproved: true }, // Commentaires approuvés pour tous
        ...(currentUserId ? [{ authorId: currentUserId }] : []), // Ses propres commentaires pour l'auteur connecté
      ]
    }

    // Récupérer les commentaires avec leurs réponses
    const comments = await prisma.comment.findMany({
      where: whereConditions,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replies: {
          where: {
            isVisible: true,
            ...(isAdmin
              ? {}
              : {
                  OR: [
                    { isApproved: true },
                    ...(currentUserId ? [{ authorId: currentUserId }] : []),
                  ],
                }),
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Ordre chronologique pour la lisibilité des threads
      },
      skip,
      take: query.limit,
    })

    // Compter le total pour la pagination (mêmes conditions)
    const total = await prisma.comment.count({
      where: whereConditions,
    })

    return NextResponse.json({
      comments,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('Erreur récupération commentaires:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commentaires' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau commentaire
export async function POST(request: NextRequest) {
  try {
    // Vérification authentification
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const userRole = (session.user as any).role

    // Vérifier que l'utilisateur n'est pas VISITOR
    if (userRole === 'VISITOR') {
      return NextResponse.json(
        { error: 'Vous devez avoir un compte pour commenter' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content, targetType, targetId, parentId } = commentSchema.parse(body)

    // Validation supplémentaire pour les réponses
    let parentComment = null
    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        include: { parent: true },
      })

      if (!parentComment) {
        return NextResponse.json({ error: 'Commentaire parent introuvable' }, { status: 404 })
      }

      // Empêcher plus de 2 niveaux de profondeur
      if (parentComment.parent) {
        return NextResponse.json(
          { error: 'Maximum 2 niveaux de réponses autorisés' },
          { status: 400 }
        )
      }

      // Vérifier que le parent cible la même ressource
      if (parentComment.targetType !== targetType || parentComment.targetId !== targetId) {
        return NextResponse.json({ error: 'Commentaire parent incompatible' }, { status: 400 })
      }
    }

    // Rate limiting : désactivé en production serverless (Vercel)
    // En production, utiliser Upstash Redis ou middleware externe
    const isProduction = process.env.NODE_ENV === 'production'
    const rateLimit = process.env.DISABLE_COMMENT_RATELIMIT !== 'true'

    if (rateLimit && !isProduction) {
      const userKey = `comment_rate_${userId}`
      const now = Date.now()
      const rateWindow = 60000 // 1 minute

      // Cache en mémoire pour développement uniquement
      const globalThis = global as any
      if (!globalThis.commentRateLimit) {
        globalThis.commentRateLimit = new Map()
      }

      const lastComment = globalThis.commentRateLimit.get(userKey)
      if (lastComment && now - lastComment < rateWindow) {
        return NextResponse.json(
          { error: 'Veuillez attendre avant de poster un autre commentaire' },
          { status: 429 }
        )
      }

      // Mettre à jour le rate limit
      globalThis.commentRateLimit.set(userKey, now)
    }

    // Créer le commentaire
    const comment = await prisma.comment.create({
      data: {
        content,
        targetType,
        targetId,
        parentId,
        authorId: userId,
        isApproved: userRole === 'ADMIN', // Auto-approuver pour les admins
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Erreur création commentaire:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création du commentaire' },
      { status: 500 }
    )
  }
}
