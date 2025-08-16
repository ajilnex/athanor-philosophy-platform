import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const moderationSchema = z.object({
  commentIds: z.array(z.string()),
  action: z.enum(['approve', 'reject', 'hide', 'show']),
})

// GET - Liste des commentaires en attente de modération
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending' // pending, approved, all
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let whereClause: any = {}

    if (status === 'pending') {
      whereClause.isApproved = false
    } else if (status === 'approved') {
      whereClause.isApproved = true
    }
    // 'all' ne filtre pas

    const skip = (page - 1) * limit

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const total = await prisma.comment.count({
      where: whereClause,
    })

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erreur récupération commentaires admin:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 })
  }
}

// POST - Actions de modération en lot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès admin requis' }, { status: 403 })
    }

    const body = await request.json()
    const { commentIds, action } = moderationSchema.parse(body)

    let updateData: any = {}

    switch (action) {
      case 'approve':
        updateData = { isApproved: true, isVisible: true }
        break
      case 'reject':
        updateData = { isApproved: false, isVisible: false }
        break
      case 'hide':
        updateData = { isVisible: false }
        break
      case 'show':
        updateData = { isVisible: true }
        break
    }

    const updatedComments = await prisma.comment.updateMany({
      where: {
        id: {
          in: commentIds,
        },
      },
      data: updateData,
    })

    return NextResponse.json({
      message: `${updatedComments.count} commentaire(s) traité(s)`,
      action,
      count: updatedComments.count,
    })
  } catch (error) {
    console.error('Erreur modération commentaires:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erreur lors de la modération' }, { status: 500 })
  }
}
