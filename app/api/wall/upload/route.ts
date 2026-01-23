import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST /api/wall/upload - Upload image for wall post
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        // Only ADMIN can upload
        if ((session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })
        }

        // Validate type - accept common image formats
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/avif',
            'image/heic',
            'image/heif',
        ]

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Format non supporté. Utilisez JPEG, PNG, GIF, WebP, AVIF ou HEIC.' },
                { status: 400 }
            )
        }

        // Max 20MB
        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: 'Fichier trop volumineux (max 20MB)' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Cloudinary with high quality settings
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        resource_type: 'image',
                        folder: 'athanor/wall',
                        use_filename: true,
                        unique_filename: true,
                        // High quality transformation
                        transformation: [
                            { width: 2400, crop: 'limit' }, // Max 2400px wide
                            { quality: 'auto:best' }, // Best quality auto-optimization
                            { fetch_format: 'auto' }, // webp/avif when supported
                        ],
                        // Keep original for downloading
                        eager: [
                            { width: 800, crop: 'limit', quality: 'auto:good' }, // Thumbnail
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
            format: result.format,
            thumbnail: result.eager?.[0]?.secure_url,
        })
    } catch (error) {
        console.error('Wall image upload error:', error)
        return NextResponse.json(
            { error: "Erreur lors de l'upload", details: (error as Error).message },
            { status: 500 }
        )
    }
}
