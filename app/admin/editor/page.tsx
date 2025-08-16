import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit3, FileText } from 'lucide-react'
import { EditorClient } from '@/components/admin/EditorClient'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

interface BilletFile {
  slug: string
  filename: string
  title?: string
}

async function getBilletsList(): Promise<BilletFile[]> {
  try {
    const contentDir = path.join(process.cwd(), 'content', 'billets')

    if (!fs.existsSync(contentDir)) {
      return []
    }

    const files = fs
      .readdirSync(contentDir)
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .map(filename => {
        const slug = filename.replace(/\.(md|mdx)$/, '')

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

    return files
  } catch (error) {
    console.error('Erreur lors du chargement de la liste:', error)
    return []
  }
}

async function getBilletContent(slug: string) {
  try {
    const safePath = slug.replace(/[^a-zA-Z0-9_-]/g, '')
    const contentDir = path.join(process.cwd(), 'content', 'billets')

    const extensions = ['mdx', 'md']
    for (const ext of extensions) {
      const filePath = path.join(contentDir, `${safePath}.${ext}`)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8')
        return {
          slug,
          filename: `${safePath}.${ext}`,
          content,
          path: path.relative(process.cwd(), filePath),
        }
      }
    }

    return null
  } catch (error) {
    console.error('Erreur lors du chargement du billet:', error)
    return null
  }
}

export default async function AdminEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  // Vérification authentification admin
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const resolvedSearchParams = await searchParams
  const editSlug = resolvedSearchParams.edit
  const billets = await getBilletsList()

  // Si un billet spécifique est demandé en édition
  if (editSlug) {
    const billetData = await getBilletContent(editSlug)

    if (!billetData) {
      return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-light text-foreground mb-4">Billet introuvable</h1>
            <Link href="/admin/editor" className="text-accent hover:text-accent/70">
              Retour à la liste
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="h-screen flex flex-col">
        {/* Header minimal */}
        <div className="border-b border-subtle/20 bg-background p-4">
          <Link
            href="/admin/editor"
            className="inline-flex items-center text-subtle hover:text-foreground text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Link>
        </div>

        {/* Editor en plein écran */}
        <div className="flex-1">
          <EditorClient
            filePath={billetData.path}
            initialContent={billetData.content}
            slug={billetData.slug}
          />
        </div>
      </div>
    )
  }

  // Page de liste des billets
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Edit3 className="h-6 w-6 text-accent" />
          <h1 className="text-2xl sm:text-3xl font-light text-foreground font-serif">
            Éditeur visuel
          </h1>
        </div>

        <p className="text-subtle">
          Sélectionnez un billet à modifier. L'éditeur permet d'insérer des références depuis la
          bibliographie et valide automatiquement les citations.
        </p>
      </div>

      {/* Liste des billets */}
      <div className="space-y-3">
        {billets.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-subtle" />
            <p className="text-subtle">Aucun billet trouvé dans content/billets/</p>
          </div>
        ) : (
          billets.map(billet => (
            <Link
              key={billet.slug}
              href={`/admin/editor?edit=${billet.slug}`}
              className="block p-4 rounded-lg border border-subtle/20 hover:border-accent/50 hover:bg-accent/5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {billet.title}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-subtle">
                    <span>Slug: {billet.slug}</span>
                    <span>Fichier: {billet.filename}</span>
                  </div>
                </div>

                <div className="text-subtle group-hover:text-accent transition-colors">
                  <Edit3 className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Navigation */}
      <div className="mt-12 pt-8 border-t border-subtle/20">
        <Link
          href="/billets"
          className="text-subtle hover:text-foreground transition-colors text-sm"
        >
          ← Retour aux billets
        </Link>
      </div>
    </div>
  )
}
