import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateBilletContent, updateFileWithContribution, deleteFileOnGitHub, getFileFromGitHub } from '@/lib/github.server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Vérification authentification (ADMIN ou USER connecté)
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const { slug } = params
    const body = await request.json()
    const { title, content, tags = [], excerpt = '' } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titre et contenu sont obligatoires' },
        { status: 400 }
      )
    }

    // Vérifier si le fichier existe sur GitHub (essayer .mdx puis .md)
    const extensions = ['mdx', 'md']
    let existingFile: { content: string; sha: string } | null = null
    let filePath = ''
    
    for (const ext of extensions) {
      const testPath = `content/billets/${slug}.${ext}`
      existingFile = await getFileFromGitHub(testPath)
      if (existingFile) {
        filePath = testPath
        break
      }
    }

    if (!existingFile) {
      return NextResponse.json(
        { error: 'Billet introuvable' },
        { status: 404 }
      )
    }

    // Extraire la date du contenu existant (ou utiliser aujourd'hui)
    const dateMatch = existingFile.content.match(/^date: ["']?([^"'\n]+)["']?$/m)
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0]

    // Génération du nouveau contenu MDX
    const mdxContent = generateBilletContent(
      title,
      date,
      Array.isArray(tags) ? tags : [],
      excerpt,
      content
    )

    // Mise à jour du fichier sur GitHub avec gestion des contributions
    const result = await updateFileWithContribution({
      path: filePath,
      content: mdxContent,
      message: `feat: Mise à jour billet "${title}"

Modifié via l'interface d'admin d'Athanor

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`,
      sha: existingFile.sha,
      author: {
        name: session.user.name || 'Utilisateur',
        email: session.user.email!,
        role: (session.user as any).role
      }
    })

    console.log(`✏️ Billet mis à jour: ${slug}`)

    // Réponse différente selon le type de contribution
    if (result.pullRequest) {
      return NextResponse.json(
        {
          success: true,
          type: 'pull_request',
          message: `Votre modification a été soumise pour révision`,
          pullRequest: result.pullRequest,
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        {
          success: true,
          type: 'direct_commit',
          message: `Billet "${title}" mis à jour avec succès`,
          slug,
          sha: result.sha,
        },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Erreur mise à jour billet:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Vérification authentification admin
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Authentification admin requise' },
        { status: 401 }
      )
    }

    const { slug } = params

    // Vérifier si le fichier existe sur GitHub (essayer .mdx puis .md)
    const extensions = ['mdx', 'md']
    let filePath = ''
    
    for (const ext of extensions) {
      const testPath = `content/billets/${slug}.${ext}`
      const existingFile = await getFileFromGitHub(testPath)
      if (existingFile) {
        filePath = testPath
        break
      }
    }

    if (!filePath) {
      return NextResponse.json(
        { error: 'Billet introuvable' },
        { status: 404 }
      )
    }

    // Suppression du fichier sur GitHub
    await deleteFileOnGitHub(
      filePath,
      `feat: Suppression billet "${slug}"

Supprimé via l'interface d'admin d'Athanor

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`
    )

    console.log(`🗑️ Billet supprimé: ${slug}`)

    return NextResponse.json(
      {
        success: true,
        message: `Billet "${slug}" supprimé avec succès`,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erreur suppression billet:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}