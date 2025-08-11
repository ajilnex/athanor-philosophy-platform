import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, FileText, Tag, Download } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PdfClientViewer } from '@/components/publications/PdfClientViewer'

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

export default async function PublicationPage({ params }: { params: { id: string } }) {
  const publication = await getPublication(params.id)

  if (!publication) {
    notFound()
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
                {publication.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-gray-100 text-foreground"
                  >
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
        />
      </div>

      {/* Publication Summary */}
      <div className="card border-subtle mt-6 sm:mt-8">
        <div className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-light text-foreground mb-3 sm:mb-4">À propos de cette publication</h2>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-sm sm:text-base font-light text-foreground mb-2 sm:mb-3">Détails du document</h3>
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
              <h3 className="text-sm sm:text-base font-light text-foreground mb-2 sm:mb-3">Téléchargement</h3>
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