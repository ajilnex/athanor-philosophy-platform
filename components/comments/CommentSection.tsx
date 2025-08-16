'use client'

import React, { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { MessageSquare, AlertCircle } from 'lucide-react'
import useSWR from 'swr'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { CommentPagination } from './CommentPagination'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  parentId: string | null
  replies: Comment[]
  isApproved: boolean
  isVisible: boolean
  createdAt: string
  updatedAt: string
  _count: {
    replies: number
  }
}

interface CommentSectionProps {
  targetType: 'billet' | 'publication'
  targetId: string
  title: string
  className?: string
}

interface ApiResponse {
  comments: Comment[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Fetcher function pour SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

export function CommentSection({
  targetType,
  targetId,
  title,
  className = '',
}: CommentSectionProps) {
  const { data: session } = useSession()
  const [page, setPage] = useState(1)
  const [comments, setComments] = useState<Comment[]>([])

  // Utilisation de SWR pour le data fetching avec pagination
  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    `/api/comments?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}&page=${page}&limit=20`,
    fetcher
  )

  // Extraire les données de la réponse SWR
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  }

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  // Synchroniser les commentaires avec les données SWR
  // Cela permet de maintenir l'état local pour les mutations optimistes
  React.useEffect(() => {
    if (data?.comments) {
      setComments(data.comments)
    }
  }, [data?.comments])

  // Ajouter un nouveau commentaire avec mutation optimiste
  const handleCommentAdded = useCallback(
    (newComment: any) => {
      // Normaliser la structure du commentaire pour correspondre à l'interface Comment
      const normalizedComment: Comment = {
        ...newComment,
        replies: [], // Nouveau commentaire n'a pas de réponses
        _count: { replies: 0 }, // Initialiser le compteur
      }
      setComments(prev => [normalizedComment, ...prev])

      // Revalider les données SWR pour synchroniser avec le serveur
      mutate()
    },
    [mutate]
  )

  // Ajouter une réponse à un commentaire existant avec mutation optimiste
  const handleReplyAdded = useCallback(
    (parentId: string, reply: any) => {
      // Normaliser la réponse
      const normalizedReply: Comment = {
        ...reply,
        replies: [], // Les réponses n'ont pas de sous-réponses (max 2 niveaux)
        _count: { replies: 0 },
      }

      setComments(prev =>
        prev.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...comment.replies, normalizedReply],
              _count: { replies: comment._count.replies + 1 },
            }
          }
          return comment
        })
      )

      // Revalider les données SWR
      mutate()
    },
    [mutate]
  )

  // Mettre à jour un commentaire avec mutation optimiste
  const handleCommentUpdated = useCallback(
    (updatedComment: Comment) => {
      setComments(prev =>
        prev.map(comment => (comment.id === updatedComment.id ? updatedComment : comment))
      )

      // Revalider les données SWR
      mutate()
    },
    [mutate]
  )

  // Supprimer/masquer un commentaire avec mutation optimiste
  const handleCommentDeleted = useCallback(
    (commentId: string) => {
      setComments(prev => prev.filter(comment => comment.id !== commentId))

      // Revalider les données SWR
      mutate()
    },
    [mutate]
  )

  // Changer de page avec SWR
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  return (
    <section className={`mt-12 pt-8 border-t border-subtle/20 ${className}`} data-graph-shield>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="h-5 w-5 text-subtle" />
          <h2 className="text-xl font-light text-foreground">Commentaires</h2>
          {pagination.total > 0 && (
            <span className="text-sm text-subtle">({pagination.total})</span>
          )}
        </div>

        <p className="text-sm text-subtle max-w-2xl font-light">
          Partagez vos réflexions sur «{title}». Les commentaires sont modérés et apparaîtront après
          approbation.
        </p>
      </div>

      {/* Formulaire de commentaire */}
      <CommentForm
        targetType={targetType}
        targetId={targetId}
        onCommentAdded={handleCommentAdded}
        className="mb-8"
      />

      {/* Affichage des erreurs */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Liste des commentaires */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-pulse text-subtle">
              Chargement des commentaires...
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-subtle opacity-50" />
            <p className="text-subtle mb-2">Aucun commentaire pour le moment</p>
            <p className="text-sm text-subtle font-light">
              Soyez le premier à partager votre réflexion !
            </p>
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                targetType={targetType}
                targetId={targetId}
                onReplyAdded={handleReplyAdded}
                onCommentUpdated={handleCommentUpdated}
                onCommentDeleted={handleCommentDeleted}
                isAdmin={isAdmin}
                currentUserId={(session?.user as any)?.id}
              />
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <CommentPagination
                pagination={pagination}
                onPageChange={handlePageChange}
                loading={isLoading}
              />
            )}
          </>
        )}
      </div>

      {/* Message pour les visiteurs */}
      {!session && comments.length > 0 && (
        <div className="mt-8 p-4 bg-muted rounded-lg border border-subtle/20">
          <p className="text-sm text-subtle text-center">
            <a href="/auth/signin" className="text-accent hover:underline">
              Connectez-vous
            </a>{' '}
            pour participer à la discussion
          </p>
        </div>
      )}
    </section>
  )
}
