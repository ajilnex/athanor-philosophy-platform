import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import path from 'path'

// GET /api/archive/[slug]/media/[id] - Récupérer un média
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params

    // Récupérer le média depuis la base de données
    const media = await prisma.conversationMedia.findUnique({
      where: { id },
      include: {
        message: {
          include: {
            archive: {
              select: { slug: true },
            },
          },
        },
      },
    })

    if (!media) {
      return NextResponse.json({ error: 'Média non trouvé' }, { status: 404 })
    }

    // Vérifier que le média appartient bien à l'archive demandée
    if (media.message.archive.slug !== slug) {
      return NextResponse.json({ error: 'Média non trouvé' }, { status: 404 })
    }

    // Construire le chemin vers le fichier local
    // Note: media.originalUri contient déjà souvent "/FEU HUMAIN/..."
    const publicDir = path.join(process.cwd(), 'public')
    let filePath: string

    if (media.originalUri.startsWith('/FEU HUMAIN/')) {
      filePath = path.join(publicDir, media.originalUri)
    } else if (media.originalUri.startsWith('FEU HUMAIN/')) {
      filePath = path.join(publicDir, media.originalUri)
    } else {
      // Fallback pour les anciens imports ou formats différents
      filePath = path.join(publicDir, 'FEU HUMAIN', media.originalUri)
    }

    try {
      // Lire le fichier
      const file = await readFile(filePath)

      // Déterminer le content-type basé sur le type de média
      let contentType = 'application/octet-stream'

      switch (media.type) {
        case 'photo':
        case 'gif':
          // Déterminer le type exact basé sur l'extension
          const ext = path.extname(media.originalUri).toLowerCase()
          if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
          else if (ext === '.png') contentType = 'image/png'
          else if (ext === '.gif') contentType = 'image/gif'
          else if (ext === '.webp') contentType = 'image/webp'
          break
        case 'video':
          const videoExt = path.extname(media.originalUri).toLowerCase()
          if (videoExt === '.mp4') contentType = 'video/mp4'
          else if (videoExt === '.webm') contentType = 'video/webm'
          else if (videoExt === '.mov') contentType = 'video/quicktime'
          break
        case 'audio':
          const audioExt = path.extname(media.originalUri).toLowerCase()
          if (audioExt === '.mp3') contentType = 'audio/mpeg'
          else if (audioExt === '.wav') contentType = 'audio/wav'
          else if (audioExt === '.m4a') contentType = 'audio/mp4'
          else if (audioExt === '.aac') contentType = 'audio/aac'
          break
      }

      // Convertir le Buffer en Uint8Array pour une compatibilité parfaite
      const uint8Array = new Uint8Array(file)

      // Retourner le fichier avec les bons headers
      return new Response(uint8Array, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch (fileError) {
      console.error(`Fichier non trouvé: ${filePath}`, fileError)

      // Si le fichier n'existe pas localement, retourner un placeholder
      // ou essayer Cloudinary si configuré
      if (media.cloudinaryUrl) {
        // Rediriger vers Cloudinary si disponible
        return NextResponse.redirect(media.cloudinaryUrl)
      }

      // Retourner une erreur 404 si le fichier n'existe pas
      return NextResponse.json(
        { error: 'Fichier média non trouvé sur le serveur' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Erreur récupération média:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération du média' }, { status: 500 })
  }
}
