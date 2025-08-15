import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  isApproved: z.boolean().optional(),
  isVisible: z.boolean().optional(),
})

// PATCH - Modifier un commentaire
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = (session.user as any).id
    const userRole = (session.user as any).role
    const isAdmin = userRole === 'ADMIN'

    // Récupérer le commentaire existant
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Commentaire introuvable' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updates = updateSchema.parse(body)

    // Vérifications d'autorisation
    const isAuthor = existingComment.authorId === userId
    
    // Seul l'auteur peut modifier le contenu (dans les 15 premières minutes)
    if (updates.content && !isAdmin) {
      if (!isAuthor) {
        return NextResponse.json(
          { error: 'Seul l\'auteur peut modifier ce commentaire' },
          { status: 403 }
        )
      }

      // Vérifier la fenêtre de temps (15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
      if (existingComment.createdAt < fifteenMinutesAgo) {
        return NextResponse.json(
          { error: 'Délai de modification expiré (15 minutes)' },
          { status: 403 }
        )
      }
    }

    // Seuls les admins peuvent modifier l'approbation et la visibilité
    if ((updates.isApproved !== undefined || updates.isVisible !== undefined) && !isAdmin) {
      return NextResponse.json(
        { error: 'Action non autorisée' },
        { status: 403 }
      )
    }

    // Appliquer les modifications
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: updates,
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

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Erreur modification commentaire:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la modification du commentaire' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un commentaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = (session.user as any).id
    const userRole = (session.user as any).role
    const isAdmin = userRole === 'ADMIN'

    // Récupérer le commentaire existant
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      include: { 
        author: true,
        replies: true,
      },
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Commentaire introuvable' },
        { status: 404 }
      )
    }

    const isAuthor = existingComment.authorId === userId

    // Seuls les admins peuvent supprimer
    // Les auteurs peuvent masquer leur propre commentaire
    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: 'Action non autorisée' },
        { status: 403 }
      )
    }

    // Si l'utilisateur est l'auteur mais pas admin, masquer seulement
    if (isAuthor && !isAdmin) {
      const updatedComment = await prisma.comment.update({
        where: { id },
        data: { isVisible: false },
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

      return NextResponse.json({
        message: 'Commentaire masqué',
        comment: updatedComment,
      })
    }

    // Suppression complète par l'admin
    if (isAdmin) {
      // Supprimer d'abord les réponses
      await prisma.comment.deleteMany({
        where: { parentId: id },
      })

      // Puis supprimer le commentaire principal
      await prisma.comment.delete({
        where: { id },
      })

      return NextResponse.json({
        message: 'Commentaire supprimé définitivement',
      })
    }
  } catch (error) {
    console.error('Erreur suppression commentaire:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du commentaire' },
      { status: 500 }
    )
  }
}