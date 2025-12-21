import Link from 'next/link'
import { FileText, User, Calendar, Tag, Download } from 'lucide-react'
import { getPublishedArticles } from '@/lib/articles'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Publication type definition
type Publication = {
  id: string
  title: string
  description: string | null
  author: string | null
  fileName: string
  tags: string[]
  publishedAt: string | Date
  fileSize: number
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// ISR: Page statique régénérée toutes les 5 minutes
export const revalidate = 300

export default async function PublicationsPage() {
  const session = await getServerSession(authOptions)
  const publications = await getPublishedArticles()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-4">Publications</h1>
        <p className="text-sm sm:text-base text-subtle max-w-3xl font-light">
          Articles et documents publiés, couvrant une large gamme de sujets philosophiques.
        </p>
      </div>

      {(session?.user as any)?.role === 'ADMIN' && (
        <div className="mb-6">
          <Link
            href="/admin/upload"
            className="inline-flex items-center gap-2 px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors text-sm"
          >
            <FileText className="h-4 w-4" /> Nouvelle publication
          </Link>
        </div>
      )}

      {publications.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-subtle mx-auto mb-4" />
          <h3 className="text-lg font-light text-foreground mb-2">Aucune publication disponible</h3>
          <p className="text-subtle mb-6 font-light">
            Les publications seront bientôt disponibles.
          </p>
          <Link
            href="/admin"
            className="text-foreground hover:text-subtle transition-colors font-light underline"
          >
            Ajouter des Publications
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {publications.map((publication: Publication) => (
            <article key={publication.id} className="card border-subtle">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-light text-foreground mb-2 sm:mb-3">
                    <Link
                      href={`/publications/${publication.id}`}
                      className="hover:text-subtle transition-colors"
                    >
                      {publication.title}
                    </Link>
                  </h2>

                  {publication.description && (
                    <p className="text-subtle mb-4 line-clamp-3 font-light">
                      {publication.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-subtle mb-4">
                    {publication.author && (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{publication.author}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {(publication.publishedAt instanceof Date
                          ? publication.publishedAt
                          : new Date(publication.publishedAt)
                        ).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{formatFileSize(publication.fileSize)}</span>
                    </div>
                  </div>

                  {publication.tags && publication.tags.length > 0 && (
                    <div className="flex items-center space-x-2 mb-4">
                      <Tag className="h-4 w-4 text-subtle" />
                      <div className="flex flex-wrap gap-2">
                        {publication.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 text-xs bg-muted text-foreground rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:w-48 flex flex-col space-y-2 lg:space-y-3">
                  <Link
                    href={`/api/articles/${publication.id}/download`}
                    className="text-foreground hover:text-subtle transition-colors font-light underline text-center text-sm sm:text-base"
                    download
                  >
                    <Download className="h-4 w-4 inline mr-2" />
                    <span>Télécharger</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
