import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Authentification admin requise' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Paramètre slug requis' },
        { status: 400 }
      )
    }

    // Sécuriser le chemin pour éviter les attaques directory traversal
    const safePath = slug.replace(/[^a-zA-Z0-9_-]/g, '')
    
    const contentDir = path.join(process.cwd(), 'content', 'billets')
    let filePath = ''
    let filename = ''

    // Essayer .mdx puis .md
    const extensions = ['mdx', 'md']
    for (const ext of extensions) {
      const testPath = path.join(contentDir, `${safePath}.${ext}`)
      if (fs.existsSync(testPath)) {
        filePath = testPath
        filename = `${safePath}.${ext}`
        break
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { error: `Billet "${slug}" introuvable` },
        { status: 404 }
      )
    }

    // Vérifier que le fichier est bien dans content/billets (sécurité)
    if (!filePath.startsWith(contentDir)) {
      return NextResponse.json(
        { error: 'Chemin non autorisé' },
        { status: 403 }
      )
    }

    const content = fs.readFileSync(filePath, 'utf8')

    return NextResponse.json({
      slug,
      filename,
      content,
      path: path.relative(process.cwd(), filePath)
    }, { status: 200 })

  } catch (error) {
    console.error('Erreur lors du chargement du billet:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}