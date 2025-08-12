import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { sealed } = await request.json()
    const { id } = params

    if (typeof sealed !== 'boolean') {
      return NextResponse.json(
        { error: 'Le paramètre sealed doit être un booléen' },
        { status: 400 }
      )
    }

    // Mettre à jour l'état de scellement de l'article
    const article = await prisma.article.update({
      where: { id },
      data: { isSealed: sealed }
    })

    return NextResponse.json({
      success: true,
      id,
      isSealed: article.isSealed,
      message: sealed ? 'Publication scellée avec succès' : 'Publication déscellée avec succès'
    })

  } catch (error) {
    console.error('Erreur scellement publication:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}