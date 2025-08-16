import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateBilletContent, updateFileOnGitHub } from '@/lib/github.server'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Authentification admin requise' }, { status: 401 })
    }

    const body = await request.json()
    let {
      title,
      slug,
      content,
      tags = [],
      excerpt = '',
    } = body as {
      title?: string
      slug?: string
      content?: string
      tags?: string[]
      excerpt?: string
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Contenu obligatoire' }, { status: 400 })
    }

    // Déterminer titre/slug depuis le contenu si non fournis
    const today = new Date().toISOString().split('T')[0]

    const normalizeSlug = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    // Tente frontmatter
    const fm = matter(content)
    const hasFrontmatter = Object.keys(fm.data || {}).length > 0
    const fmTitle = (fm.data?.title as string | undefined)?.toString().trim()

    // Tente H1
    const h1Match = content.match(/^#\s+(.+)$/m)
    const h1Title = h1Match?.[1]?.trim()

    // Tags/excerpt depuis frontmatter si disponibles
    if (hasFrontmatter) {
      if (!Array.isArray(tags) || tags.length === 0) {
        const fmTags = fm.data?.tags
        if (Array.isArray(fmTags)) tags = fmTags.map(String)
      }
      if (!excerpt) {
        const fmExcerpt = fm.data?.excerpt
        if (typeof fmExcerpt === 'string') excerpt = fmExcerpt
      }
    }

    // Déterminer titre effectif
    const effectiveTitle: string | undefined = (title && title.trim()) || fmTitle || h1Title
    if (!effectiveTitle) {
      return NextResponse.json(
        { error: 'Titre manquant. Ajoutez un frontmatter (title) ou un H1 au début.' },
        { status: 400 }
      )
    }

    // Déterminer slug effectif
    const baseSlug = slug && slug.trim() ? slug.trim() : normalizeSlug(effectiveTitle)
    const effectiveSlug = /^[a-z0-9-]+$/i.test(baseSlug) ? baseSlug : normalizeSlug(baseSlug)

    // Validation minimale (car on a déjà normalisé)
    if (!/^[a-z0-9-]+$/i.test(effectiveSlug)) {
      return NextResponse.json(
        { error: 'Le slug doit contenir uniquement des lettres, chiffres et tirets' },
        { status: 400 }
      )
    }

    // Génération du contenu MDX
    let mdxContent: string
    if (hasFrontmatter && fmTitle) {
      // Conserver le contenu tel quel si frontmatter déjà fourni
      mdxContent = content
    } else {
      // Construire un frontmatter minimal à partir du H1 (ou titre fourni)
      mdxContent = generateBilletContent(
        effectiveTitle as string,
        today,
        Array.isArray(tags) ? tags : [],
        excerpt,
        content
      )
    }

    // Création du fichier sur GitHub
    const filePath = `content/billets/${effectiveSlug}.mdx`

    try {
      const result = await updateFileOnGitHub({
        path: filePath,
        content: mdxContent,
        message: `feat: Nouveau billet "${effectiveTitle}"

Créé via l'interface d'admin d'Athanor

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`,
      })

      console.log(`✨ Nouveau billet créé: ${slug}`)

      return NextResponse.json(
        {
          success: true,
          message: `Billet "${effectiveTitle}" créé avec succès`,
          slug: effectiveSlug,
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
