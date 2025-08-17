import { NextRequest, NextResponse } from 'next/server'
import { getBilletBySlug } from '@/lib/billets'
import { isFileInTrash } from '@/lib/github.server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params

  try {
    console.log('📥 Download request for billet:', resolvedParams.slug)

    // Vérifier si le billet est dans trash
    const isDeleted = await isFileInTrash(`content/billets/${resolvedParams.slug}.mdx`)
    if (isDeleted) {
      console.log('❌ Billet is in trash')
      return new NextResponse('Billet not found', { status: 404 })
    }

    // Récupérer le billet depuis le filesystem
    const billet = await getBilletBySlug(resolvedParams.slug)

    if (!billet) {
      console.log('❌ Billet not found')
      return new NextResponse('Billet not found', { status: 404 })
    }

    console.log('📄 Billet found:', billet.title)

    // Lire le fichier source original depuis le filesystem
    const CONTENT_DIR = path.join(process.cwd(), 'content', 'billets')
    const filePath = path.join(CONTENT_DIR, `${resolvedParams.slug}.mdx`)

    let originalContent: string
    try {
      originalContent = await fs.readFile(filePath, 'utf8')
    } catch (error) {
      console.log('❌ Error reading original file:', error)
      return new NextResponse('Source file not available', { status: 404 })
    }

    // Préparer le nom du fichier pour le téléchargement
    const filename = `${billet.title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')}.md`

    console.log('✅ Serving file as:', filename)

    // Retourner le contenu original avec headers de téléchargement
    return new NextResponse(originalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('❌ Download error:', error)
    return new NextResponse(
      `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    )
  }
}
