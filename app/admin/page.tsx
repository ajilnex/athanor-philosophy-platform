import Link from 'next/link'
import {
  FileText,
  Settings,
  Upload,
  Lock,
  ShieldAlert,
  LogOut,
  Users,
  Clock,
  Flame,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const isPreview = process.env.VERCEL_ENV === 'preview'

async function getPublicationStats() {
  try {
    const [totalPublications, publishedPublications, totalSize] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { isPublished: true } }),
      prisma.article.aggregate({ _sum: { fileSize: true } }),
    ])

    return {
      total: totalPublications,
      published: publishedPublications,
      totalSize: totalSize._sum.fileSize || 0,
    }
  } catch {
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

async function AdminNormalPage() {
  const session = await getServerSession(authOptions)

  // 1) Pas connecté -> écran "Se connecter"
  if (!session) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <Lock className="h-10 w-10 mx-auto mb-4 text-subtle" />
        <h1 className="text-2xl font-light text-foreground mb-2">Espace administration</h1>
        <p className="text-subtle mb-6 font-light">Connecte-toi pour continuer.</p>
        <Link
          href="/api/auth/signin?callbackUrl=/admin"
          className="inline-flex items-center px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors"
        >
          Se connecter avec GitHub
        </Link>
        <p className="text-xs text-subtle mt-4 font-light">
          Après connexion, tu reviendras ici automatiquement.
        </p>
      </div>
    )
  }

  // 2) Connecté mais pas admin -> 403 propre
  if (session.user?.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <ShieldAlert className="h-10 w-10 mx-auto mb-4 text-subtle" />
        <h1 className="text-2xl font-light text-foreground mb-2">Accès refusé (403)</h1>
        <p className="text-subtle mb-4 font-light">
          Connecté en tant que{' '}
          <span className="font-medium">{session.user?.email ?? 'utilisateur'}</span>, mais sans
          droits admin.
        </p>
        <div className="bg-muted text-left text-xs p-3 border border-subtle rounded mb-6 overflow-x-auto">
          <p className="mb-2">Pour te promouvoir admin (à exécuter côté base) :</p>
          <code className="text-foreground">UPDATE "User" SET role = 'ADMIN' WHERE email = 'ton-email@github';</code>
        </div>
        <Link
          href="/api/auth/signout?callbackUrl=/"
          className="inline-flex items-center gap-2 underline text-sm"
        >
          <LogOut className="h-4 w-4" /> Se déconnecter
        </Link>
      </div>
    )
  }

  // 3) Admin -> dashboard
  const stats = await getPublicationStats()

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-foreground mb-4">Administration</h1>
        <p className="text-base text-subtle font-light">
          Gérez vos publications et les paramètres de la plateforme.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-subtle">Total des publications</p>
              <p className="text-xl sm:text-2xl font-light text-foreground">{stats.total}</p>
            </div>
            <FileText className="h-6 w-6 text-subtle" />
          </div>
        </div>
        <div className="card border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-subtle">Publications publiées</p>
              <p className="text-xl sm:text-2xl font-light text-foreground">{stats.published}</p>
            </div>
            <FileText className="h-6 w-6 text-subtle" />
          </div>
        </div>
        <div className="card border-subtle">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-subtle">Taille totale</p>
              <p className="text-xl sm:text-2xl font-light text-foreground">
                {formatFileSize(stats.totalSize)}
              </p>
            </div>
            <Upload className="h-6 w-6 text-subtle" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Ajout déplacé dans les pages publiques (Publications / Home) */}

        <Link
          href="/admin/seal"
          className="card border-subtle hover:border-foreground transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-light text-foreground">Sceller contenu</h3>
              <p className="text-sm text-subtle font-light">Billets et publications</p>
            </div>
          </div>
        </Link>

        {/* Gestion des billets: scellement regroupé, édition pilotée dans le site */}

        {/* Éditer les billets retiré: pilotage depuis l'intérieur du site */}

        <Link
          href="/admin/users"
          className="card border-subtle hover:border-foreground transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Users className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-light text-foreground">Gestion des Utilisateurs</h3>
              <p className="text-sm text-subtle font-light">Rôles et permissions</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/brouillons"
          className="card border-subtle hover:border-foreground transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-light text-foreground">Brouillons</h3>
              <p className="text-sm text-subtle font-light">Billets en cours d'écriture</p>
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

        <Link
          href="/admin/feu-humain"
          className="card border-subtle hover:border-orange-600 transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-light text-foreground">Archive FEU HUMAIN</h3>
              <p className="text-sm text-subtle font-light">Conversation légendaire</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card border-subtle">
        <h2 className="text-lg font-light text-foreground mb-6">Activité Récente</h2>
        <div className="text-center py-8 text-subtle">
          <FileText className="h-8 w-8 mx-auto mb-4 text-subtle" />
          <p>Aucune activité récente à afficher</p>
          <p className="text-sm mt-2 font-light">Les actions d'administration apparaîtront ici</p>
        </div>
      </div>
    </div>
  )
}
export default async function AdminPage() {
  if (isPreview) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Zone admin désactivée en mode Preview</h1>
        <p>Utilise la version locale ou la production.</p>
      </div>
    )
  }
  return AdminNormalPage()
}
