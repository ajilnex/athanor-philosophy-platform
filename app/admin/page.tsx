'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, Settings, Upload } from 'lucide-react'

interface Stats {
  total: number
  published: number
  totalSize: number
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, totalSize: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    
    // Refresh stats every 30 seconds to stay up to date  
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || 'default-dev-key'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-900 mb-4">
          Administration
        </h1>
        <p className="text-lg text-gray-600">
          Gérez vos articles de philosophie et les paramètres de la plateforme.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total des articles</p>
              <p className="text-3xl font-bold text-primary-900">
                {isLoading ? '...' : stats.total}
              </p>
            </div>
            <FileText className="h-8 w-8 text-primary-700" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Articles publiés</p>
              <p className="text-3xl font-bold text-green-600">
                {isLoading ? '...' : stats.published}
              </p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taille totale</p>
              <p className="text-3xl font-bold text-blue-600">
                {isLoading ? '...' : formatFileSize(stats.totalSize)}
              </p>
            </div>
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/upload"
          className="card hover:shadow-lg transition-shadow duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 group-hover:bg-primary-200 w-12 h-12 rounded-lg flex items-center justify-center transition-colors">
              <Plus className="h-6 w-6 text-primary-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Ajouter un Article</h3>
              <p className="text-sm text-gray-600">Uploader un nouveau PDF</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/articles"
          className="card hover:shadow-lg transition-shadow duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 group-hover:bg-blue-200 w-12 h-12 rounded-lg flex items-center justify-center transition-colors">
              <FileText className="h-6 w-6 text-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gérer les Articles</h3>
              <p className="text-sm text-gray-600">Modifier, supprimer, publier</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/settings"
          className="card hover:shadow-lg transition-shadow duration-200 group"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 group-hover:bg-gray-200 w-12 h-12 rounded-lg flex items-center justify-center transition-colors">
              <Settings className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Paramètres</h3>
              <p className="text-sm text-gray-600">Configuration du site</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-2xl font-serif font-semibold text-primary-900 mb-6">
          Activité Récente
        </h2>
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Aucune activité récente à afficher</p>
          <p className="text-sm mt-2">
            Les actions d'administration apparaîtront ici
          </p>
        </div>
      </div>
    </div>
  )
}