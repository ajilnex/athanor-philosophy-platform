'use client'

import React, { useState, useEffect, useCallback, startTransition, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
    Heart,
    Send,
    Loader2,
    Pin,
    Trash2,
    ArrowLeft,
    Flame,
    ImagePlus,
    X,
} from 'lucide-react'

interface WallPost {
    id: string
    content: string
    imageUrl?: string | null
    author: {
        id: string
        name: string | null
        image: string | null
        role: string
    }
    isPinned: boolean
    createdAt: string
    replyCount: number
    reactions: Record<string, number>
    userReactions: Array<{ type: string; userId: string }>
}

export default function WallClient() {
    const { data: session } = useSession()
    const [posts, setPosts] = useState<WallPost[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [cursor, setCursor] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)
    const [newPostContent, setNewPostContent] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // Image upload state
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Preview
        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target?.result as string)
        reader.readAsDataURL(file)

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/wall/upload', {
                method: 'POST',
                body: formData,
            })

            if (res.ok) {
                const data = await res.json()
                setImageUrl(data.url)
            } else {
                const error = await res.json()
                alert(error.error || "Erreur d'upload")
                setImagePreview(null)
            }
        } catch {
            alert("Erreur d'upload")
            setImagePreview(null)
        } finally {
            setUploading(false)
        }
    }

    const removeImage = () => {
        setImageUrl(null)
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const fetchPosts = useCallback(async (cursorParam?: string | null) => {
        try {
            const url = cursorParam ? `/api/wall?cursor=${cursorParam}` : '/api/wall'
            const res = await fetch(url)
            const data = await res.json()


            if (cursorParam) {
                setPosts(prev => [...prev, ...data.posts])
            } else {
                setPosts(data.posts)
            }
            setCursor(data.nextCursor)
            setHasMore(data.hasMore)
        } catch (error) {
            console.error('Error fetching posts:', error)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    useEffect(() => {
        const interval = setInterval(() => fetchPosts(), 30000)
        return () => clearInterval(interval)
    }, [fetchPosts])

    const loadMore = useCallback(() => {
        if (!hasMore || loadingMore) return
        setLoadingMore(true)
        fetchPosts(cursor)
    }, [cursor, hasMore, loadingMore, fetchPosts])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPostContent.trim() || submitting || uploading) return

        const tempId = `temp-${Date.now()}`
        const contentToPost = newPostContent
        const imageToPost = imageUrl
        const optimisticPost: WallPost = {
            id: tempId,
            content: contentToPost,
            imageUrl: imageToPost,
            author: {
                id: (session?.user as any)?.id || '',
                name: session?.user?.name || 'Vous',
                image: session?.user?.image || null,
                role: (session?.user as any)?.role || 'USER',
            },
            isPinned: false,
            createdAt: new Date().toISOString(),
            replyCount: 0,
            reactions: {},
            userReactions: [],
        }

        // Optimistic update with startTransition
        startTransition(() => {
            setPosts(prev => [optimisticPost, ...prev])
        })
        setNewPostContent('')
        removeImage()
        setSubmitting(true)

        try {
            const res = await fetch('/api/wall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: contentToPost, imageUrl: imageToPost }),
            })

            if (res.ok) {
                const newPost = await res.json()
                setPosts(prev => [newPost, ...prev.filter(p => p.id !== tempId)])
            } else {
                setPosts(prev => prev.filter(p => p.id !== tempId))
                setNewPostContent(contentToPost)
            }
        } catch {
            setPosts(prev => prev.filter(p => p.id !== tempId))
            setNewPostContent(contentToPost)
        } finally {
            setSubmitting(false)
        }
    }

    const toggleReaction = async (postId: string, type: string = 'like') => {
        const userId = (session?.user as any)?.id
        if (!userId) return

        setPosts(prev => prev.map(post => {
            if (post.id !== postId) return post

            const hasReaction = post.userReactions.some(
                r => r.type === type && r.userId === userId
            )

            if (hasReaction) {
                return {
                    ...post,
                    reactions: { ...post.reactions, [type]: Math.max(0, (post.reactions[type] || 1) - 1) },
                    userReactions: post.userReactions.filter(r => !(r.type === type && r.userId === userId)),
                }
            } else {
                return {
                    ...post,
                    reactions: { ...post.reactions, [type]: (post.reactions[type] || 0) + 1 },
                    userReactions: [...post.userReactions, { type, userId }],
                }
            }
        }))

        try {
            await fetch(`/api/wall/${postId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type }),
            })
        } catch {
            fetchPosts()
        }
    }

    const deletePost = async (postId: string) => {
        if (!confirm('Supprimer ce post ?')) return
        setPosts(prev => prev.filter(p => p.id !== postId))
        try {
            await fetch(`/api/wall/${postId}`, { method: 'DELETE' })
        } catch {
            fetchPosts()
        }
    }

    const isAdmin = (session?.user as any)?.role === 'ADMIN'
    const userId = (session?.user as any)?.id

    return (
        <div className="min-h-screen bg-[var(--sol-base3)]">
            {/* Header - Brutalist style */}
            <header className="border-b-2 border-[var(--sol-base02)] bg-[var(--sol-base3)]">
                <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-[var(--sol-base01)] hover:text-[var(--sol-base02)] transition"
                        >
                            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-serif font-semibold text-[var(--sol-base02)] tracking-tight">
                                Le Mur
                            </h1>
                            <p className="text-xs font-mono text-[var(--sol-base01)] uppercase tracking-widest mt-0.5">
                                Flux de pensées
                            </p>
                        </div>
                    </div>
                    <div className="text-xs font-mono text-[var(--sol-base1)]">
                        {posts.length} posts
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8">
                {/* Composer - Minimal brutalist */}
                {isAdmin && (
                    <form onSubmit={handleSubmit} className="mb-12">
                        <div className="border-2 border-[var(--sol-base02)] bg-[var(--sol-base2)]">
                            <textarea
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                                placeholder="Une pensée..."
                                className="w-full bg-transparent resize-none border-0 focus:ring-0 text-[var(--sol-base02)] placeholder:text-[var(--sol-base1)] text-lg font-serif p-6 min-h-[140px] leading-relaxed"
                                rows={4}
                            />

                            {/* Image Preview */}
                            {imagePreview && (
                                <div className="relative mx-6 mb-4">
                                    <img
                                        src={imagePreview}
                                        alt="Aperçu"
                                        className="w-full max-h-[300px] object-cover border border-[var(--sol-base01)]"
                                    />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 p-1.5 bg-[var(--sol-base02)] text-white hover:bg-[var(--sol-red)] transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between items-center px-6 py-4 border-t-2 border-[var(--sol-base02)]">
                                <div className="flex items-center gap-4">
                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp,image/avif,image/heic,image/heif"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        id="wall-image-upload"
                                    />
                                    <label
                                        htmlFor="wall-image-upload"
                                        className={`inline-flex items-center gap-2 px-3 py-2 border border-[var(--sol-base01)] text-[var(--sol-base01)] font-mono text-xs uppercase tracking-wider cursor-pointer hover:bg-[var(--sol-base2)] hover:border-[var(--sol-base02)] hover:text-[var(--sol-base02)] transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <ImagePlus className="w-4 h-4" />
                                        Image
                                    </label>
                                    <span className="text-xs font-mono text-[var(--sol-base1)] uppercase">
                                        {newPostContent.length} car.
                                    </span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newPostContent.trim() || submitting || uploading}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--sol-base02)] text-[var(--sol-base3)] font-mono text-sm uppercase tracking-wider hover:bg-[var(--sol-base03)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Publier
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Posts Feed */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--sol-base01)]" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-[var(--sol-base1)]">
                        <p className="text-lg font-serif text-[var(--sol-base01)]">Le mur est vide</p>
                        <p className="text-sm font-mono text-[var(--sol-base1)] mt-2 uppercase tracking-wider">
                            Les premières pensées arriveront bientôt
                        </p>
                    </div>
                ) : (
                    <div className="space-y-0">
                        {posts.map((post, index) => (
                            <article
                                key={post.id}
                                className={`
                  border-l-2 border-r-2 border-b-2 border-[var(--sol-base02)]
                  ${index === 0 ? 'border-t-2' : ''}
                  ${post.isPinned ? 'bg-[var(--sol-base2)]' : 'bg-[var(--sol-base3)]'}
                  ${post.id.startsWith('temp-') ? 'opacity-60' : ''}
                  transition-colors
                `}
                            >
                                {/* Post Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sol-base1)]/30">
                                    <div className="flex items-center gap-3">
                                        {post.author.image ? (
                                            <img
                                                src={post.author.image}
                                                alt=""
                                                className="w-8 h-8 rounded-full border border-[var(--sol-base01)]"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-[var(--sol-base02)] flex items-center justify-center text-[var(--sol-base3)] font-mono text-sm font-bold">
                                                {post.author.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-medium text-[var(--sol-base02)] text-sm">
                                                {post.author.name || 'Anonyme'}
                                            </span>
                                            {post.isPinned && (
                                                <Pin className="inline-block w-3 h-3 ml-2 text-[var(--sol-orange)]" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <time className="text-xs font-mono text-[var(--sol-base1)] uppercase">
                                            {formatDistanceToNow(new Date(post.createdAt), {
                                                addSuffix: false,
                                                locale: fr,
                                            })}
                                        </time>
                                        {(post.author.id === userId || isAdmin) && !post.id.startsWith('temp-') && (
                                            <button
                                                onClick={() => deletePost(post.id)}
                                                className="p-1.5 text-[var(--sol-base1)] hover:text-[var(--sol-red)] transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-6">
                                    <p className="text-[var(--sol-base02)] font-serif text-lg leading-relaxed whitespace-pre-wrap">
                                        {post.content}
                                    </p>
                                </div>

                                {/* Image */}
                                {post.imageUrl && (
                                    <div className="px-6 pb-6">
                                        <img
                                            src={post.imageUrl}
                                            alt=""
                                            className="w-full max-h-[500px] object-cover border border-[var(--sol-base01)]"
                                        />
                                    </div>
                                )}

                                {/* Reactions */}
                                <div className="flex items-center gap-1 px-6 py-3 border-t border-[var(--sol-base1)]/30 bg-[var(--sol-base2)]/50">
                                    <button
                                        onClick={() => session && toggleReaction(post.id, 'like')}
                                        disabled={!session}
                                        className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition
                      ${post.userReactions.some(r => r.type === 'like' && r.userId === userId)
                                                ? 'bg-[var(--sol-red)] text-white'
                                                : 'text-[var(--sol-base01)] hover:bg-[var(--sol-base2)] hover:text-[var(--sol-red)]'
                                            }
                    `}
                                    >
                                        <Heart className={`w-3.5 h-3.5 ${post.userReactions.some(r => r.type === 'like' && r.userId === userId)
                                            ? 'fill-current' : ''
                                            }`} />
                                        {post.reactions.like || 0}
                                    </button>
                                    <button
                                        onClick={() => session && toggleReaction(post.id, 'fire')}
                                        disabled={!session}
                                        className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition
                      ${post.userReactions.some(r => r.type === 'fire' && r.userId === userId)
                                                ? 'bg-[var(--sol-orange)] text-white'
                                                : 'text-[var(--sol-base01)] hover:bg-[var(--sol-base2)] hover:text-[var(--sol-orange)]'
                                            }
                    `}
                                    >
                                        <Flame className={`w-3.5 h-3.5 ${post.userReactions.some(r => r.type === 'fire' && r.userId === userId)
                                            ? 'fill-current' : ''
                                            }`} />
                                        {post.reactions.fire || 0}
                                    </button>
                                </div>
                            </article>
                        ))}

                        {/* Load More */}
                        {hasMore && (
                            <div className="pt-8 flex justify-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="px-8 py-3 border-2 border-[var(--sol-base02)] text-[var(--sol-base02)] font-mono text-sm uppercase tracking-wider hover:bg-[var(--sol-base02)] hover:text-[var(--sol-base3)] disabled:opacity-50 transition-colors"
                                >
                                    {loadingMore ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Charger plus'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t-2 border-[var(--sol-base02)] mt-16 py-6">
                <p className="text-center text-xs font-mono text-[var(--sol-base1)] uppercase tracking-widest">
                    Le Mur · Athanor
                </p>
            </footer>
        </div>
    )
}
