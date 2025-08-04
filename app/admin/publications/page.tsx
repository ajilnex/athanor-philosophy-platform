import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { AdminArticleActions } from '@/components/admin/AdminArticleActions'

async function getAllPublications() {
  try {
    return await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
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

export default async function AdminPublicationsPage() {
  const publications = await getAllPublications()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'administration
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-4">
              Gestion des Publications
            </h1>
            <p className="text-sm sm:text-base text-subtle font-light">
              Gérez toutes vos publications: voir et supprimer.
            </p>
          </div>
          <Link
            href="/admin/upload"
            className="text-foreground hover:text-subtle transition-colors font-light underline text-sm sm:text-base"
          >
            Ajouter une Publication
          </Link>
        </div>
      </div>

      {publications.length === 0 ? (
        <div className="card border-subtle text-center py-12">
          <h3 className="text-base sm:text-lg font-light text-foreground mb-4">
            Aucune publication trouvée
          </h3>
          <p className="text-sm sm:text-base text-subtle mb-6 font-light">
            Commencez par ajouter votre première publication.
          </p>
          <Link
            href="/admin/upload"
            className="text-foreground hover:text-subtle transition-colors font-light underline text-sm sm:text-base"
          >
            Ajouter une Publication
          </Link>
        </div>
      ) : (
        <div className="card border-subtle">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-subtle">
                  <th className="text-left py-3 sm:py-4 px-1 sm:px-2 font-light text-foreground text-xs sm:text-sm">
                    Titre
                  </th>
                  <th className="text-left py-3 sm:py-4 px-1 sm:px-2 font-light text-foreground text-xs sm:text-sm hidden sm:table-cell">
                    Auteur
                  </th>
                  <th className="text-left py-3 sm:py-4 px-1 sm:px-2 font-light text-foreground text-xs sm:text-sm hidden md:table-cell">
                    Taille
                  </th>
                  <th className="text-left py-3 sm:py-4 px-1 sm:px-2 font-light text-foreground text-xs sm:text-sm hidden lg:table-cell">
                    Date
                  </th>
                  <th className="text-right py-3 sm:py-4 px-1 sm:px-2 font-light text-foreground text-xs sm:text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {publications.map((publication) => (
                  <tr key={publication.id} className="hover:bg-gray-50">
                    <td className="py-3 sm:py-4 px-1 sm:px-2">
                      <div>
                        <h3 className="font-light text-foreground mb-1 text-sm sm:text-base">
                          {publication.title}
                        </h3>
                        {publication.description && (
                          <p className="text-xs sm:text-sm text-subtle line-clamp-2 font-light">
                            {publication.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-1 sm:px-2 text-subtle font-light text-xs sm:text-sm hidden sm:table-cell">
                      {publication.author || '-'}
                    </td>
                    <td className="py-3 sm:py-4 px-1 sm:px-2 text-subtle text-xs sm:text-sm font-light hidden md:table-cell">
                      {formatFileSize(publication.fileSize)}
                    </td>
                    <td className="py-3 sm:py-4 px-1 sm:px-2 text-subtle text-xs sm:text-sm font-light hidden lg:table-cell">
                      {new Date(publication.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 sm:py-4 px-1 sm:px-2">
                      <AdminArticleActions article={publication} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}