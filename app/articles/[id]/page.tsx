import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, FileText, Tag, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PDFViewer } from '@/components/PDFViewer'
import { PrintButton } from '@/components/PrintButton'
import { parseTags } from '@/lib/utils'

async function getArticle(id: string) {
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

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id)

  if (!article || !article.isPublished) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/articles"
          className="inline-flex items-center text-primary-700 hover:text-primary-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux articles
        </Link>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-4xl font-serif font-bold text-primary-900 mb-6">
            {article.title}
          </h1>
          
          {article.description && (
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {article.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
            {article.author && (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{article.author}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>{formatFileSize(article.fileSize)}</span>
            </div>
          </div>
          
          {(() => {
            const tags = parseTags(article.tags)
            return tags.length > 0 && (
              <div className="flex items-center space-x-2 mb-6">
                <Tag className="h-4 w-4 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })()}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/articles/${article.id}/pdf`}
              className="btn-primary inline-flex items-center justify-center space-x-2"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Ouvrir dans un nouvel onglet</span>
            </Link>
            <PrintButton className="btn-secondary">
              Imprimer
            </PrintButton>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Visualiseur PDF</h2>
          <p className="text-sm text-gray-600 mt-1">
            Lisez l'article directement dans votre navigateur
          </p>
        </div>
        <div className="p-6">
          <PDFViewer filePath={article.filePath} />
        </div>
      </div>
    </div>
  )
}