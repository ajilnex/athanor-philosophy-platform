import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
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
    const { slug } = await params

    if (typeof sealed !== 'boolean') {
      return NextResponse.json(
        { error: 'Le paramètre sealed doit être un booléen' },
        { status: 400 }
      )
    }

    // Vérifier ou créer l'entrée billet dans la base
    let billet = await prisma.billet.findUnique({
      where: { slug }
    })

    if (!billet) {
      // Créer l'entrée si elle n'existe pas (pour les billets legacy)
      billet = await prisma.billet.create({
        data: {
          slug,
          title: `Billet ${slug}`, // Titre temporaire
          content: '',
          date: new Date(),
          isSealed: sealed
        }
      })
    } else {
      // Mettre à jour l'état de scellement
      billet = await prisma.billet.update({
        where: { slug },
        data: { isSealed: sealed }
      })
    }

    return NextResponse.json({
      success: true,
      slug,
      isSealed: billet.isSealed,
      message: sealed ? 'Billet scellé avec succès' : 'Billet déscellé avec succès'
    })

  } catch (error) {
    console.error('Erreur scellement billet:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}