'use client'

import { useState, useRef, useEffect } from 'react'
import { Reply, Edit3, Trash2, Eye, EyeOff, Clock, User } from 'lucide-react'
import { CommentForm } from './CommentForm'

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

interface CommentItemProps {
  comment: Comment
  targetType: 'billet' | 'publication'
  targetId: string
  onReplyAdded: (parentId: string, reply: Comment) => void
  onCommentUpdated: (comment: Comment) => void
  onCommentDeleted: (commentId: string) => void
  isAdmin: boolean
  currentUserId?: string
  depth?: number
}

export function CommentItem({
  comment,
  targetType,
  targetId,
  onReplyAdded,
  onCommentUpdated,
  onCommentDeleted,
  isAdmin,
  currentUserId,
  depth = 0
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  const isAuthor = currentUserId === comment.author.id
  const canEdit = isAuthor && isWithinEditWindow(comment.createdAt)
  const canReply = depth < 1 // Maximum 2 niveaux
  const isModerated = !comment.isApproved && !isAdmin

  // Vérifier si on est dans la fenêtre de modification (15 minutes)
  function isWithinEditWindow(createdAt: string) {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60)
    return diffMinutes <= 15
  }

  // Auto-focus et resize de la textarea d'édition
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus()
      editTextareaRef.current.style.height = 'auto'
      editTextareaRef.current.style.height = editTextareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  // Gestion de la réponse ajoutée
  const handleReplyAdded = (reply: Comment) => {
    onReplyAdded(comment.id, reply)
    setShowReplyForm(false)
  }

  // Édition du commentaire
  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false)
      setEditContent(comment.content)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la modification')
      }

      const updatedComment = await response.json()
      onCommentUpdated(updatedComment)
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur modification:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la modification')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Suppression/masquage du commentaire
  const handleDelete = async () => {
    const action = isAdmin ? 'supprimer définitivement' : 'masquer'
    const confirmMessage = `Êtes-vous sûr de vouloir ${action} ce commentaire ?`
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la suppression')
      }

      const result = await response.json()
      
      if (isAdmin || result.comment?.isVisible === false) {
        onCommentDeleted(comment.id)
      } else if (result.comment) {
        onCommentUpdated(result.comment)
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression')
    }
  }

  // Modération admin
  const handleModeration = async (action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isApproved: action === 'approve',
          isVisible: action === 'approve',
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la modération')
      }

      const updatedComment = await response.json()
      onCommentUpdated(updatedComment)
    } catch (error) {
      console.error('Erreur modération:', error)
      alert('Erreur lors de la modération')
    }
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = (now.getTime() - date.getTime()) / (1000 * 60)

    if (diffMinutes < 1) return 'À l\'instant'
    if (diffMinutes < 60) return `Il y a ${Math.floor(diffMinutes)} min`
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  // Ne pas afficher si masqué et pas admin/auteur
  if (!comment.isVisible && !isAdmin && !isAuthor) {
    return null
  }

  return (
    <article className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-subtle/20' : ''}`}>
      <div className="bg-white border border-subtle/20 rounded-lg p-4">
        {/* Header du commentaire */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden">
              {comment.author.image ? (
                <img 
                  src={comment.author.image} 
                  alt={comment.author.name || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-subtle" />
              )}
            </div>

            {/* Nom et date */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm">
                  {comment.author.name || 'Utilisateur anonyme'}
                </span>
                
                {/* Badges de statut */}
                {isModerated && (
                  <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">
                    En attente
                  </span>
                )}
                {!comment.isVisible && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                    Masqué
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-subtle">
                <Clock className="h-3 w-3" />
                <time dateTime={comment.createdAt}>
                  {formatDate(comment.createdAt)}
                </time>
                {comment.updatedAt !== comment.createdAt && (
                  <span className="text-subtle/70">• modifié</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 text-subtle hover:text-foreground rounded transition-colors"
                title="Modifier (15 min max)"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            
            {(isAuthor || isAdmin) && (
              <button
                onClick={handleDelete}
                className="p-1 text-subtle hover:text-destructive rounded transition-colors"
                title={isAdmin ? "Supprimer définitivement" : "Masquer"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Actions admin */}
            {isAdmin && !comment.isApproved && (
              <>
                <button
                  onClick={() => handleModeration('approve')}
                  className="p-1 text-green-600 hover:text-green-700 rounded transition-colors"
                  title="Approuver"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleModeration('reject')}
                  className="p-1 text-red-600 hover:text-red-700 rounded transition-colors"
                  title="Rejeter"
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Contenu */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              ref={editTextareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border border-subtle/30 rounded text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-accent/50"
              maxLength={2000}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(comment.content)
                }}
                className="px-3 py-1 text-sm text-subtle hover:text-foreground border rounded"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                onClick={handleEdit}
                disabled={isSubmitting || !editContent.trim()}
                className="px-3 py-1 text-sm bg-accent text-white rounded hover:bg-accent/90
                         disabled:opacity-50"
              >
                {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none mb-3">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
          </div>
        )}

        {/* Actions utilisateur */}
        {!isEditing && (
          <div className="flex items-center gap-4 text-sm">
            {canReply && currentUserId && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-subtle hover:text-accent transition-colors"
              >
                <Reply className="h-4 w-4" />
                <span>Répondre</span>
              </button>
            )}

            {comment._count.replies > 0 && (
              <span className="text-subtle">
                {comment._count.replies} réponse{comment._count.replies > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Formulaire de réponse */}
      {showReplyForm && (
        <div className="mt-4">
          <CommentForm
            targetType={targetType}
            targetId={targetId}
            parentId={comment.id}
            onCommentAdded={handleReplyAdded}
            onCancel={() => setShowReplyForm(false)}
            placeholder="Votre réponse..."
          />
        </div>
      )}

      {/* Réponses */}
      {comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              targetType={targetType}
              targetId={targetId}
              onReplyAdded={onReplyAdded}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </article>
  )
}