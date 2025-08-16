import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, FileText, Tag, Download, Lock } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { CommentSection } from '@/components/comments/CommentSection'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import dynamic from 'next/dynamic'

const PdfClientViewer = dynamic(
  () => import('@/components/publications/PdfClientViewer').then(mod => mod.PdfClientViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mx-auto mb-4"></div>
          <p className="text-subtle">Chargement du lecteur PDF...</p>
        </div>
      </div>
    ),
  }
)

async function getPublication(id: string) {
  try {
    return await prisma.article.findUnique({
      where: { id },
    })
  } catch (error) {
    return null
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default async function PublicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const session = await getServerSession(authOptions)
  const { id } = await params
  const searchParamsResolved = await searchParams
  const publication = await getPublication(id)
  let initialPage = searchParamsResolved.page ? parseInt(searchParamsResolved.page, 10) : 1

  if (!publication) {
    notFound()
  }

  const isSealed = publication.isSealed || false
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  // Si la publication est scellée et l'utilisateur n'est pas admin, interdire l'accès
  if (isSealed && !isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href="/publications"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux publications
        </Link>

        <div className="text-center py-12">
          <Lock className="h-12 w-12 mx-auto mb-4 text-subtle" />
          <h1 className="text-2xl font-light text-foreground mb-2">Publication scellée</h1>
          <p className="text-subtle mb-6">Cette publication est réservée aux administrateurs.</p>
          {!session && (
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Si un terme de recherche est fourni, essayer de trouver la page correspondante
  if (searchParamsResolved.q && !searchParamsResolved.page) {
    try {
      const searchResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/find-in-pdf?url=${encodeURIComponent(publication.filePath)}&q=${encodeURIComponent(searchParamsResolved.q)}`,
        { cache: 'no-store' } // Important pour les recherches dynamiques
      )

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json()
        if (searchResult.found && searchResult.pageNumber) {
          initialPage = searchResult.pageNumber
        }
      }
    } catch (error) {
      console.error('Error searching in PDF:', error)
      // Continue avec la page par défaut en cas d'erreur
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/publications"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux publications
        </Link>

        <div className="card border-subtle p-8">
          <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-4 sm:mb-6">
            {publication.title}
          </h1>

          {publication.description && (
            <p className="text-sm sm:text-base text-subtle mb-4 sm:mb-6 leading-relaxed font-light">
              {publication.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-subtle mb-4 sm:mb-6">
            {publication.author && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{publication.author}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(publication.publishedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{formatFileSize(publication.fileSize)}</span>
            </div>
          </div>

          {publication.tags && publication.tags.length > 0 && (
            <div className="flex items-center space-x-2 mb-6">
              <Tag className="h-4 w-4 text-subtle" />
              <div className="flex flex-wrap gap-2">
                {publication.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 text-sm bg-gray-100 text-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href={`/api/articles/${publication.id}/download`}
              className="text-foreground hover:text-subtle transition-colors font-light underline inline-flex items-center justify-center space-x-2"
              download
            >
              <Download className="h-4 w-4" />
              <span>Télécharger</span>
            </Link>
            <div className="text-xs sm:text-sm text-subtle self-center font-light mt-2 sm:mt-0">
              Fichier: {publication.fileName} ({formatFileSize(publication.fileSize)})
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="mt-8">
        <PdfClientViewer
          pdfUrl={publication.filePath}
          title={publication.title}
          initialPage={initialPage}
        />
      </div>

      {/* Section commentaires */}
      <CommentSection
        targetType="publication"
        targetId={publication.id}
        title={publication.title}
      />

      {/* Publication Summary */}
      <div className="card border-subtle mt-6 sm:mt-8">
        <div className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-light text-foreground mb-3 sm:mb-4">
            À propos de cette publication
          </h2>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-sm sm:text-base font-light text-foreground mb-2 sm:mb-3">
                Détails du document
              </h3>
              <div className="space-y-2 text-xs sm:text-sm text-subtle">
                <div className="flex justify-between">
                  <span>Nom du fichier:</span>
                  <span>{publication.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taille:</span>
                  <span>{formatFileSize(publication.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span>PDF</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-light text-foreground mb-2 sm:mb-3">
                Téléchargement
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm text-subtle font-light">
                  Cliquez sur le lien ci-dessous pour télécharger ce document.
                </p>
                <Link
                  href={`/api/articles/${publication.id}/download`}
                  className="text-foreground hover:text-subtle transition-colors font-light underline inline-flex items-center space-x-2 text-sm"
                  download
                >
                  <Download className="h-4 w-4" />
                  <span>Télécharger {publication.fileName}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
