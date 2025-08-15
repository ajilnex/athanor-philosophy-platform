'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Send, X, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface CommentFormProps {
  targetType: 'billet' | 'publication'
  targetId: string
  parentId?: string
  onCommentAdded: (comment: any) => void
  onCancel?: () => void
  placeholder?: string
  className?: string
}

export function CommentForm({ 
  targetType, 
  targetId, 
  parentId, 
  onCommentAdded, 
  onCancel,
  placeholder = "Partagez votre réflexion...",
  className = '' 
}: CommentFormProps) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [honeypot, setHoneypot] = useState('')
  const [startTime] = useState(Date.now())

  const isReply = !!parentId
  const userRole = (session?.user as any)?.role
  const canComment = session && userRole !== 'VISITOR'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canComment) {
      setError('Vous devez être connecté pour commenter')
      return
    }

    // Protection anti-spam
    if (honeypot) {
      // Bot détecté (honeypot rempli)
      setError('Erreur de validation')
      return
    }

    const timeSinceStart = Date.now() - startTime
    if (timeSinceStart < 3000) {
      // Trop rapide (moins de 3 secondes)
      setError('Veuillez prendre le temps de rédiger votre commentaire')
      return
    }

    if (!content.trim()) {
      setError('Le commentaire ne peut pas être vide')
      return
    }

    if (content.length > 2000) {
      setError('Le commentaire ne peut pas dépasser 2000 caractères')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          targetType,
          targetId,
          parentId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la publication')
      }

      const newComment = await response.json()
      onCommentAdded(newComment)
      setContent('')
      
      if (onCancel) {
        onCancel() // Fermer le formulaire de réponse
      }
    } catch (err) {
      console.error('Erreur publication commentaire:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  // Si l'utilisateur n'est pas connecté
  if (!session) {
    return (
      <div className={`p-4 bg-muted rounded-lg border border-subtle/20 ${className}`}>
        <p className="text-sm text-subtle text-center">
          <Link href="/auth/signin" className="text-accent hover:underline">
            Connectez-vous
          </Link>
          {' '}pour participer à la discussion
        </p>
      </div>
    )
  }

  // Si l'utilisateur est visiteur
  if (userRole === 'VISITOR') {
    return (
      <div className={`p-4 bg-muted rounded-lg border border-subtle/20 ${className}`}>
        <p className="text-sm text-subtle text-center">
          Votre compte ne permet pas de commenter.
          Contactez un administrateur pour plus d'informations.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-3">
        {/* Honeypot anti-spam (invisible) */}
        <div className="hidden">
          <label htmlFor={`website-${parentId || 'main'}`}>Website (leave empty):</label>
          <input
            id={`website-${parentId || 'main'}`}
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Zone de texte */}
        <div>
          <label htmlFor={`comment-${parentId || 'main'}`} className="sr-only">
            {isReply ? 'Votre réponse' : 'Votre commentaire'}
          </label>
          <textarea
            id={`comment-${parentId || 'main'}`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[100px] p-3 border border-subtle/30 rounded-lg 
                     bg-background text-foreground placeholder-subtle/70
                     focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
                     resize-y font-light"
            disabled={isSubmitting}
            maxLength={2000}
          />
          
          {/* Compteur de caractères */}
          <div className="flex justify-between items-center mt-2 text-xs text-subtle">
            <span>
              {content.length}/2000 caractères
            </span>
            <span className="text-subtle/60">
              Ctrl/Cmd + Entrée pour publier
            </span>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-subtle">
            {userRole === 'ADMIN' ? (
              <span className="text-accent">✓ Publication immédiate (Admin)</span>
            ) : (
              <span>Commentaire en attente de modération</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isReply && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-2 text-sm text-subtle hover:text-foreground 
                         border border-subtle/30 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white 
                       rounded-lg hover:bg-accent/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              <span>
                {isSubmitting ? 'Publication...' : isReply ? 'Répondre' : 'Publier'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}