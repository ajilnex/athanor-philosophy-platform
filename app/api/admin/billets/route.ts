import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateBilletContent, updateFileOnGitHub } from '@/lib/github.server'
import matter from 'gray-matter'

export async function POST(request: NextRequest) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
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
    // Horodatage à la minute près (ISO) pour un tri précis intrajournalier
    const nowISO = new Date().toISOString()

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

    // Déterminer titre effectif, avec fallback sur les premiers mots du contenu
    let effectiveTitle: string | undefined = (title && title.trim()) || fmTitle || h1Title
    if (!effectiveTitle) {
      // Extraire un titre depuis le corps en cherchant la première ligne significative
      const lines = String(content || '').split('\n')

      // Fonction pour vérifier si une ligne est significative (contient du vrai texte)
      const isSignificantLine = (line: string): boolean => {
        // Nettoyer la ligne des caractères décoratifs courants
        const cleaned = line
          .replace(/[═─━┃│┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬▀▄█▌▐░▒▓]/g, '') // box-drawing et blocs
          .replace(/[*_~`#>|+-]/g, '') // Markdown
          .replace(/\s+/g, ' ')
          .trim()

        // Vérifier qu'il reste au moins 3 caractères alphabétiques
        const alphaCount = (cleaned.match(/[a-zA-ZÀ-ÿ]/g) || []).length
        return alphaCount >= 3
      }

      // Trouver la première ligne significative
      let significantContent = ''
      for (const line of lines) {
        // Nettoyer la ligne
        const processed = line
          .replace(/```[\s\S]*?```/g, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
          .replace(/^#+\s+/, '')
          .replace(/[═─━┃│┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬▀▄█▌▐░▒▓]/g, '') // Supprimer les box-drawing
          .replace(/\s+/g, ' ')
          .trim()

        if (isSignificantLine(processed) && processed.length > 0) {
          significantContent = processed
          break
        }
      }

      if (significantContent) {
        const words = significantContent.split(' ').filter(Boolean)
        if (words.length > 0) {
          const head = words.slice(0, 8).join(' ')
          effectiveTitle = head + (words.length > 8 ? '…' : '')
        }
      }
    }

    // Validation finale du titre : doit contenir au moins 2 caractères alphabétiques
    if (effectiveTitle) {
      const alphaCount = (effectiveTitle.match(/[a-zA-ZÀ-ÿ]/g) || []).length
      if (alphaCount < 2) {
        effectiveTitle = undefined
      }
    }
    if (!effectiveTitle) {
      return NextResponse.json(
        { error: 'Titre manquant et contenu vide: impossible de déduire un titre.' },
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
        nowISO,
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
