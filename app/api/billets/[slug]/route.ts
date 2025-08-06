import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug manquant' },
        { status: 400 }
      )
    }

    // Vérifier si le billet existe
    const existingBillet = await prisma.billet.findUnique({
      where: { slug }
    })
    
    if (!existingBillet) {
      return NextResponse.json(
        { error: 'Billet introuvable' },
        { status: 404 }
      )
    }

    // Supprimer le billet de la base de données
    await prisma.billet.delete({
      where: { slug }
    })
    
    console.log(`🗑️ Billet supprimé: ${slug}`)

    return NextResponse.json(
      { 
        success: true, 
        message: `Billet "${slug}" supprimé avec succès` 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du billet:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    )
  }
}