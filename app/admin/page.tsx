import Link from 'next/link'
import { Plus, FileText, Settings, Upload } from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getPublicationStats() {
  try {
    const [totalPublications, publishedPublications, totalSize] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { isPublished: true } }),
      prisma.article.aggregate({
        _sum: { fileSize: true },
      }),
    ])

    return {
      total: totalPublications,
      published: publishedPublications,
      totalSize: totalSize._sum.fileSize || 0,
    }
  } catch (error) {
    return { total: 0, published: 0, totalSize: 0 }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default async function AdminPage() {
  const stats = await getPublicationStats()

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-foreground mb-4">
          Administration
        </h1>
        <p className="text-base text-subtle font-light">
          Gérez vos publications et les paramètres de la plateforme.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-subtle">Total des publications</p>
              <p className="text-2xl font-light text-foreground">{stats.total}</p>
            </div>
            <FileText className="h-6 w-6 text-subtle" />
          </div>
        </div>
        <div className="card border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-subtle">Publications publiées</p>
              <p className="text-2xl font-light text-foreground">{stats.published}</p>
            </div>
            <FileText className="h-6 w-6 text-subtle" />
          </div>
        </div>
        <div className="card border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-subtle">Taille totale</p>
              <p className="text-2xl font-light text-foreground">{formatFileSize(stats.totalSize)}</p>
            </div>
            <Upload className="h-6 w-6 text-subtle" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/upload"
          className="card border-subtle hover:border-foreground transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-light text-foreground">Ajouter une Publication</h3>
              <p className="text-sm text-subtle font-light">Uploader un nouveau PDF</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/publications"
          className="card border-subtle hover:border-foreground transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-light text-foreground">Gérer les Publications</h3>
              <p className="text-sm text-subtle font-light">Modifier, supprimer, publier</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="card border-subtle hover:border-foreground transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-light text-foreground">Paramètres</h3>
              <p className="text-sm text-subtle font-light">Configuration du site</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card border-subtle">
        <h2 className="text-lg font-light text-foreground mb-6">
          Activité Récente
        </h2>
        <div className="text-center py-8 text-subtle">
          <FileText className="h-8 w-8 mx-auto mb-4 text-subtle" />
          <p>Aucune activité récente à afficher</p>
          <p className="text-sm mt-2 font-light">
            Les actions d'administration apparaîtront ici
          </p>
        </div>
      </div>
    </div>
  )
}