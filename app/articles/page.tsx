import Link from 'next/link'
import { FileText, User, Calendar, Tag } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { parseTags } from '@/lib/utils'

async function getArticles() {
  try {
    return await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: 'desc' },
    })
  } catch (error) {
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

export default async function ArticlesPage() {
  const articles = await getArticles()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-900 mb-4">
          Articles de Philosophie
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Explorez notre collection d'articles philosophiques couvrant une large gamme 
          de sujets contemporains et classiques.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Aucun article disponible
          </h3>
          <p className="text-gray-500 mb-6">
            Les articles seront bientôt disponibles. Revenez plus tard !
          </p>
          <Link href="/admin" className="btn-primary">
            Ajouter des Articles
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-serif font-semibold text-primary-900 mb-3">
                    <Link
                      href={`/articles/${article.id}`}
                      className="hover:text-primary-700 transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h2>
                  
                  {article.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    {article.author && (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{article.author}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(article.publishedAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{formatFileSize(article.fileSize)}</span>
                    </div>
                  </div>
                  
                  {(() => {
                    const tags = parseTags(article.tags)
                    return tags.length > 0 && (
                      <div className="flex items-center space-x-2 mb-4">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
                
                <div className="lg:w-48 flex flex-col space-y-3">
                  <Link
                    href={`/articles/${article.id}`}
                    className="btn-primary text-center"
                  >
                    Lire l'Article
                  </Link>
                  <Link
                    href={`/articles/${article.id}/pdf`}
                    className="btn-secondary text-center"
                    target="_blank"
                  >
                    Ouvrir PDF
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