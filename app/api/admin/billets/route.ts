import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateBilletContent, updateFileOnGitHub } from '@/lib/github.server'

export async function POST(request: NextRequest) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Authentification admin requise' }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, tags = [], excerpt = '' } = body

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Titre, slug et contenu sont obligatoires' },
        { status: 400 }
      )
    }

    // Validation du slug (format YYYY-MM-DD-nom ou libre)
    if (!/^[a-z0-9-]+$/i.test(slug)) {
      return NextResponse.json(
        { error: 'Le slug doit contenir uniquement des lettres, chiffres et tirets' },
        { status: 400 }
      )
    }

    // Génération de la date (aujourd'hui par défaut)
    const today = new Date().toISOString().split('T')[0]

    // Génération du contenu MDX
    const mdxContent = generateBilletContent(
      title,
      today,
      Array.isArray(tags) ? tags : [],
      excerpt,
      content
    )

    // Création du fichier sur GitHub
    const filePath = `content/billets/${slug}.mdx`

    try {
      const result = await updateFileOnGitHub({
        path: filePath,
        content: mdxContent,
        message: `feat: Nouveau billet "${title}"

Créé via l'interface d'admin d'Athanor

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`,
      })

      console.log(`✨ Nouveau billet créé: ${slug}`)

      return NextResponse.json(
        {
          success: true,
          message: `Billet "${title}" créé avec succès`,
          slug,
          sha: result.sha,
        },
        { status: 201 }
      )
    } catch (githubError: any) {
      console.error('Erreur GitHub:', githubError)

      if (githubError.status === 422) {
        return NextResponse.json({ error: 'Un billet avec ce slug existe déjà' }, { status: 409 })
      }

      throw githubError
    }
  } catch (error) {
    console.error('Erreur création billet:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
