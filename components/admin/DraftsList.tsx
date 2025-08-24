'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Clock, User, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Draft {
  id: string
  slug: string
  title: string | null
  content: string
  tags: string[]
  excerpt: string | null
  createdAt: string
  updatedAt: string
  user: {
    name: string | null
    email: string
  }
}

export function DraftsList() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDrafts = async () => {
    try {
      const response = await fetch('/api/drafts')
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des brouillons')
      }
      const data = await response.json()
      setDrafts(data.drafts)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDraft = async (slug: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce brouillon ?')) {
      return
    }

    try {
      const response = await fetch(`/api/drafts/${slug}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      setDrafts(prev => prev.filter(draft => draft.slug !== slug))
      toast.success('Brouillon supprimé')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    }
  }

  useEffect(() => {
    fetchDrafts()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPreview = (content: string) => {
    // Nettoyer le contenu pour un aperçu
    const cleaned = content
      .replace(/^---[\s\S]*?---/m, '') // Supprimer frontmatter
      .replace(/^#+\s/gm, '') // Supprimer les markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Supprimer bold
      .replace(/\*(.*?)\*/g, '$1') // Supprimer italique
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Liens -> texte
      .trim()

    return cleaned.substring(0, 200) + (cleaned.length > 200 ? '...' : '')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-subtle">Chargement des brouillons...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-destructive">{error}</p>
        <button onClick={fetchDrafts} className="mt-2 text-sm text-destructive hover:underline">
          Réessayer
        </button>
      </div>
    )
  }

  if (drafts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-subtle/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-subtle mb-2">Aucun brouillon</h3>
        <p className="text-subtle/70 mb-4">
          Les brouillons apparaîtront ici lors de l'écriture de nouveaux billets.
        </p>
        <Link
          href="/billets/nouveau"
          className="inline-flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <FileText className="w-4 h-4 mr-2" />
          Nouveau billet
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {drafts.map(draft => (
        <div
          key={draft.id}
          className="bg-white border border-subtle/20 rounded-lg p-6 hover:border-subtle/40 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Titre et métadonnées */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    {draft.title || (
                      <span className="italic text-subtle">
                        {draft.content
                          .split('\n')[0]
                          ?.replace(/^#+\s*/, '')
                          .substring(0, 50) || 'Sans titre'}
                        {draft.content.length > 50 ? '...' : ''}
                      </span>
                    )}
                  </h3>

                  {/* Tags */}
                  {draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {draft.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 text-xs bg-muted text-subtle rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/billets/nouveau?draft=${draft.slug}`}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-accent text-white rounded hover:bg-accent/90 transition-colors"
                  >
                    Continuer l'écriture
                  </Link>

                  <button
                    onClick={() => deleteDraft(draft.slug)}
                    className="p-1.5 text-subtle hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="Supprimer le brouillon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Aperçu du contenu */}
              <p className="text-subtle text-sm mb-4 leading-relaxed">
                {getPreview(draft.content)}
              </p>

              {/* Métadonnées */}
              <div className="flex items-center gap-4 text-xs text-subtle">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {draft.user.name || draft.user.email}
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Modifié {formatDate(draft.updatedAt)}
                </div>

                <div className="text-subtle/70">{draft.content.length} caractères</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
