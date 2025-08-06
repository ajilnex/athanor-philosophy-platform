import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const billetsDirectory = path.join(process.cwd(), 'content/billets')

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

    const filePath = path.join(billetsDirectory, `${slug}.md`)
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Billet introuvable' },
        { status: 404 }
      )
    }

    // Supprimer le fichier
    fs.unlinkSync(filePath)
    
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