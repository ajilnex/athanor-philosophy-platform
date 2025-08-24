import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Authentification admin requise' }, { status: 401 })
    }

    const params = await context.params
    const draft = await prisma.draft.findUnique({
      where: { slug: params.slug },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!draft) {
      return NextResponse.json({ error: 'Brouillon non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Erreur récupération brouillon:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Authentification admin requise' }, { status: 401 })
    }

    const params = await context.params
    await prisma.draft.delete({
      where: { slug: params.slug },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression brouillon:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
