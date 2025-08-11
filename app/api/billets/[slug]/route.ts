import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getBilletBySlug } from '@/lib/billets'
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

    // Vérifier si le billet existe dans le filesystem
    const existingBillet = await getBilletBySlug(slug)
    
    if (!existingBillet) {
      return NextResponse.json(
        { error: 'Billet introuvable' },
        { status: 404 }
      )
    }

    // Supprimer le fichier Markdown (essayer .md et .mdx)
    const extensions = ['md', 'mdx']
    let deleted = false
    
    for (const ext of extensions) {
      try {
        const filePath = join(process.cwd(), 'content', 'billets', `${slug}.${ext}`)
        await unlink(filePath)
        console.log(`📁 Fichier supprimé: ${slug}.${ext}`)
        deleted = true
        break
      } catch (fileError) {
        // Fichier n'existe pas avec cette extension, essayer la suivante
      }
    }
    
    if (!deleted) {
      console.warn(`⚠️ Aucun fichier trouvé pour le slug: ${slug}`)
      return NextResponse.json(
        { error: 'Fichier de billet introuvable' },
        { status: 404 }
      )
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