import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

interface BilletFile {
  slug: string
  filename: string
  title?: string
}

export async function GET(request: NextRequest) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Authentification admin requise' }, { status: 403 })
    }

    const contentDir = path.join(process.cwd(), 'content', 'billets')

    if (!fs.existsSync(contentDir)) {
      return NextResponse.json({ error: 'Dossier content/billets introuvable' }, { status: 404 })
    }

    // Lire tous les fichiers .md/.mdx
    const files = fs
      .readdirSync(contentDir)
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .map(filename => {
        const slug = filename.replace(/\.(md|mdx)$/, '')

        // Essayer de lire le titre depuis le front matter
        try {
          const filePath = path.join(contentDir, filename)
          const content = fs.readFileSync(filePath, 'utf8')
          const titleMatch = content.match(/^title:\s*["'](.+)["']/m)
          const title = titleMatch ? titleMatch[1] : slug

          return { slug, filename, title }
        } catch (error) {
          return { slug, filename, title: slug }
        }
      })
      .sort((a, b) => a.title.localeCompare(b.title))

    return NextResponse.json({ files }, { status: 200 })
  } catch (error) {
    console.error('Erreur lors de la liste des billets:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
