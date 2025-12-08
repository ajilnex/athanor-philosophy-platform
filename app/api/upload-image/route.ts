import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

// Configuration App Router pour upload de gros fichiers
export const dynamic = 'force-dynamic' // S'assure que la route est toujours exécutée dynamiquement
export const maxDuration = 60 // Augmente le timeout à 60s pour les gros uploads

export async function POST(request: NextRequest) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Authentification admin requise' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    // Validation type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Type de fichier non supporté' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'athanor/billets',
            use_filename: true,
            unique_filename: true,
            transformation: [
              { width: 1600, crop: 'limit' }, // Redimensionne si plus large que 1600px
              { quality: 'auto:good' }, // Compresse intelligemment
              { fetch_format: 'auto' }, // Choisit le meilleur format (webp/avif)
            ],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        .end(buffer)
    })

    const result = uploadResult as any

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    })
  } catch (error) {
    console.error("Erreur d'upload sur l'API:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'upload.", details: (error as Error).message },
      { status: 500 }
    )
  }
}
