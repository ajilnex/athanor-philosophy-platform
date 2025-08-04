import Link from 'next/link'
import { FileText, User, Calendar, Tag, Download } from 'lucide-react'

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

import { prisma } from '@/lib/prisma'

// Direct Prisma call for build time, fallback to API for runtime
async function getPublications(): Promise<Publication[]> {
  try {
    console.log('🔍 Fetching publications...')
    
    // During build, use direct Prisma connection
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'production') {
      // Build time - return empty array to avoid build failures
      console.log('⚠️ Build time - returning empty publications array')
      return []
    }
    
    // Runtime - use direct Prisma (show all publications)
    const publications = await prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
    })
    
    console.log(`📄 Found ${publications.length} publications`)
    return publications
  } catch (error) {
    console.error('❌ Error fetching publications:', error)
    return []
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'

export default async function PublicationsPage() {
  const publications = await getPublications()

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-foreground mb-4">
          Publications
        </h1>
        <p className="text-base text-subtle max-w-3xl font-light">
          Articles et documents publiés, couvrant une large gamme de sujets philosophiques.
        </p>
      </div>

      {publications.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-subtle mx-auto mb-4" />
          <h3 className="text-lg font-light text-foreground mb-2">
            Aucune publication disponible
          </h3>
          <p className="text-subtle mb-6 font-light">
            Les publications seront bientôt disponibles.
          </p>
          <Link href="/admin" className="text-foreground hover:text-subtle transition-colors font-light underline">
            Ajouter des Publications
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {publications.map((publication: Publication) => (
            <article
              key={publication.id}
              className="card border-subtle mb-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-xl font-light text-foreground mb-3">
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
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-subtle mb-4">
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
                        {publication.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="lg:w-48 flex flex-col space-y-3">
                  <Link
                    href={`/api/articles/${publication.id}/download`}
                    className="text-foreground hover:text-subtle transition-colors font-light underline text-center"
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