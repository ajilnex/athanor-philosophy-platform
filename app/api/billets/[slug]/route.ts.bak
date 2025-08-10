import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

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
    
    // Supprimer le fichier Markdown du disque
    try {
      const filePath = join(process.cwd(), 'content', 'billets', `${slug}.md`)
      await unlink(filePath)
      console.log(`📁 Fichier supprimé: ${slug}.md`)
    } catch (fileError) {
      console.warn(`⚠️ Impossible de supprimer le fichier ${slug}.md:`, fileError)
      // On continue même si le fichier n'existe pas ou n'a pas pu être supprimé
    }
    
    // Invalider les caches pour que l'UI se mette à jour
    revalidatePath('/billets')
    revalidatePath(`/billets/${slug}`)
    
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