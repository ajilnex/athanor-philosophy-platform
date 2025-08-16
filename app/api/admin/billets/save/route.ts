import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { updateFileOnGitHub } from '@/lib/github.server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

/**
 * Extrait toutes les citations d'un contenu MDX
 */
function extractCitations(content: string): string[] {
  const citeRegex = /<Cite\s+item=["']([^"']+)["'][^>]*\/?>(?:<\/Cite>)?/gi
  const citations: string[] = []
  let match

  while ((match = citeRegex.exec(content)) !== null) {
    citations.push(match[1])
  }

  return [...new Set(citations)] // Dédoublonner
}

/**
 * Valide les citations contre la bibliographie
 */
function validateCitations(content: string): { valid: boolean; invalidKeys: string[] } {
  try {
    // Charger la bibliographie
    const bibliographyPath = path.join(process.cwd(), 'public', 'bibliography.json')

    if (!fs.existsSync(bibliographyPath)) {
      console.warn('Bibliographie non trouvée, validation ignorée')
      return { valid: true, invalidKeys: [] }
    }

    const bibliography = JSON.parse(fs.readFileSync(bibliographyPath, 'utf8'))
    const validKeys = new Set(bibliography.map((entry: any) => entry.key))

    // Extraire et valider les citations
    const citations = extractCitations(content)
    const invalidKeys = citations.filter(key => !validKeys.has(key))

    return {
      valid: invalidKeys.length === 0,
      invalidKeys,
    }
  } catch (error) {
    console.error('Erreur lors de la validation des citations:', error)
    return { valid: false, invalidKeys: [] }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Authentification admin requise' }, { status: 403 })
    }

    const body = await request.json()
    const { path: relativePath, content } = body

    if (!relativePath || !content) {
      return NextResponse.json({ error: 'Paramètres path et content requis' }, { status: 400 })
    }

    // Valider les citations
    const validation = validateCitations(content)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Citations invalides détectées',
          invalidKeys: validation.invalidKeys,
          message: `Clés inconnues: ${validation.invalidKeys.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Extraire le slug pour le message de commit
    const filename = path.basename(relativePath)
    const slug = filename.replace(/\.(md|mdx)$/, '')

    // Sauvegarder via GitHub
    await updateFileOnGitHub({
      path: relativePath,
      content,
      message: `✍️ editor: update ${slug}

Modifié via l'éditeur visuel d'Athanor

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`,
    })

    console.log(`✍️ Billet sauvegardé via éditeur: ${slug}`)

    return NextResponse.json(
      {
        ok: true,
        message: `Billet "${slug}" sauvegardé avec succès`,
        citationsCount: extractCitations(content).length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
