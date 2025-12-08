import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Authentification admin requise' }, { status: 401 })
    }

    const body = await request.json()
    const { slug, title, content, tags = [], excerpt = '' } = body

    if (!slug || !content) {
      return NextResponse.json({ error: 'Slug et contenu obligatoires' }, { status: 400 })
    }

    // Normaliser le slug
    const normalizeSlug = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    const normalizedSlug = normalizeSlug(slug)

    // Créer ou mettre à jour le brouillon
    const draft = await prisma.draft.upsert({
      where: { slug: normalizedSlug },
      update: {
        title,
        content,
        tags,
        excerpt,
      },
      create: {
        slug: normalizedSlug,
        title,
        content,
        tags,
        excerpt,
        userId: session.user.id!,
      },
    })

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        slug: draft.slug,
        title: draft.title,
        updatedAt: draft.updatedAt,
      },
    })
  } catch (error) {
    console.error('Erreur sauvegarde brouillon:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Authentification admin requise' }, { status: 401 })
    }

    // Récupérer tous les brouillons des admins, triés par dernière modification
    const drafts = await prisma.draft.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Erreur récupération brouillons:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
