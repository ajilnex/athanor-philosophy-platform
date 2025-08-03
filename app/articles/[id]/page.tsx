import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, FileText, Tag, Download } from 'lucide-react'
import { prisma } from '@/lib/prisma'

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
          
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center space-x-2 mb-6">
              <Tag className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/api/articles/${article.id}/download`}
              className="btn-primary inline-flex items-center justify-center space-x-2"
              download
            >
              <Download className="h-4 w-4" />
              <span>Télécharger le PDF</span>
            </Link>
            <div className="text-sm text-gray-500 self-center">
              Fichier: {article.fileName} ({formatFileSize(article.fileSize)})
            </div>
          </div>
        </div>
      </div>

      {/* Article Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">À propos de cet article</h2>
          <p className="text-sm text-gray-600 mt-1">
            Informations sur le document et téléchargement
          </p>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Détails du document</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom du fichier:</span>
                  <span className="font-medium">{article.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taille:</span>
                  <span className="font-medium">{formatFileSize(article.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium">PDF</span>
                </div>
                {article.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Catégorie:</span>
                    <span className="font-medium">{article.category}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Téléchargement</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Cliquez sur le bouton ci-dessous pour télécharger ce document PDF sur votre appareil.
                </p>
                <Link
                  href={`/api/articles/${article.id}/download`}
                  className="btn-primary inline-flex items-center space-x-2 w-full justify-center"
                  download
                >
                  <Download className="h-5 w-5" />
                  <span>Télécharger {article.fileName}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}