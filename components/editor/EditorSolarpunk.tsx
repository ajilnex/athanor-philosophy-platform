'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Save,
    Eye,
    EyeOff,
    ImageIcon,
    BookOpen,
    Link2,
    X,
    FileText,
    Hash,
    Sparkles,
    Clock,
    AlignLeft,
    Quote,
    CheckCircle2,
    Circle,
    Loader2,
} from 'lucide-react'
import { remark } from 'remark'
import html from 'remark-html'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import toast from 'react-hot-toast'
import { ImageUpload } from '@/components/billets/ImageUpload'
import { CitationPicker } from './CitationPicker'
import { BacklinkPicker } from './BacklinkPicker'
import './editor-solarpunk.css'

interface EditorSolarpunkProps {
    mode: 'create' | 'edit'
    userRole?: 'ADMIN' | 'USER'
    initialData?: {
        slug?: string
        title?: string
        content?: string
        tags?: string[]
        excerpt?: string
    }
    startImmersive?: boolean
    draftSlug?: string
}

// Compute document stats
function useDocumentStats(content: string) {
    return useMemo(() => {
        const words = content.trim().split(/\s+/).filter(Boolean).length
        const readingTime = Math.max(1, Math.round(words / 200))
        const citations = (content.match(/<Cite\s/g) || []).length
        const backlinks = (content.match(/\[\[[^\]]+\]\]/g) || []).length
        const headings = content.match(/^#{1,3}\s+.+$/gm) || []

        return { words, readingTime, citations, backlinks, headings }
    }, [content])
}

// Extract sections from content for graduated ruler
function useSections(content: string) {
    return useMemo(() => {
        const lines = content.split('\n')
        const sections: { level: number; title: string; line: number }[] = []

        lines.forEach((line, i) => {
            const match = line.match(/^(#{1,3})\s+(.+)$/)
            if (match) {
                sections.push({
                    level: match[1].length,
                    title: match[2].slice(0, 30),
                    line: i
                })
            }
        })

        return sections
    }, [content])
}

export function EditorSolarpunk({
    mode,
    userRole,
    initialData,
    startImmersive = false,
    draftSlug
}: EditorSolarpunkProps) {
    const router = useRouter()
    const editorRef = useRef<any>(null)
    const [writingStartTime] = useState(() => Date.now())

    // Main state
    const [title, setTitle] = useState(initialData?.title || '')
    const [tags, setTags] = useState<string[]>(initialData?.tags || [])
    const [content, setContent] = useState(initialData?.content || '')
    const [excerpt] = useState<string>(initialData?.excerpt || '')

    // UI state
    const [showPreview, setShowPreview] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isAutoSaving, setIsAutoSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [previewHtml, setPreviewHtml] = useState<string>('')
    const [isImmersive, setIsImmersive] = useState(false)
    const [nightMode, setNightMode] = useState(false)
    const [showExitButton, setShowExitButton] = useState(false)
    const hideExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [writingTime, setWritingTime] = useState(0)

    // Modals
    const [showImageUpload, setShowImageUpload] = useState(false)
    const [showCitationPicker, setShowCitationPicker] = useState(false)
    const [showBacklinkPicker, setShowBacklinkPicker] = useState(false)
    const [selectedTextForBacklink, setSelectedTextForBacklink] = useState('')

    // Computed
    const stats = useDocumentStats(content)
    const sections = useSections(content)

    // Determine phase
    const phase = useMemo(() => {
        if (!content.trim()) return 'draft'
        if (stats.words < 100) return 'draft'
        if (stats.words < 500) return 'revision'
        return 'ready'
    }, [content, stats.words])

    // Writing timer
    useEffect(() => {
        if (!isImmersive) return
        const interval = setInterval(() => {
            setWritingTime(Math.floor((Date.now() - writingStartTime) / 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [isImmersive, writingStartTime])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    // Auto-save
    useEffect(() => {
        if (!content.trim() || isImmersive) return

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current)
        }

        autoSaveTimerRef.current = setTimeout(async () => {
            setIsAutoSaving(true)
            try {
                const slug = draftSlug || initialData?.slug || 'draft-' + Date.now()
                await fetch('/api/drafts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug, title, content, tags, excerpt })
                })
                setLastSaved(new Date())
            } catch (e) {
                console.error('Auto-save failed:', e)
            } finally {
                setIsAutoSaving(false)
            }
        }, 5000)

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
        }
    }, [content, title, tags, excerpt, draftSlug, initialData?.slug, isImmersive])

    // Insert at cursor
    const insertAtCursor = useCallback((snippet: string) => {
        const view: EditorView | undefined = editorRef.current?.view
        if (!view) {
            setContent(prev => prev ? `${prev}\n\n${snippet}` : snippet)
            return
        }
        const { from, to } = view.state.selection.main
        view.dispatch({ changes: { from, to, insert: snippet } })
        setContent(view.state.doc.toString())
        setTimeout(() => view.focus(), 0)
    }, [])

    const getSelectedText = useCallback(() => {
        const view: EditorView | undefined = editorRef.current?.view
        if (!view) return ''
        const { from, to } = view.state.selection.main
        return from === to ? '' : view.state.sliceDoc(from, to)
    }, [])

    // Save / Publish
    const handleSave = useCallback(async () => {
        if (!content.trim()) {
            setError('Le contenu est obligatoire')
            toast.error('Le contenu est obligatoire')
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const endpoint = mode === 'create'
                ? '/api/admin/billets'
                : `/api/admin/billets/${initialData?.slug}`

            const response = await fetch(endpoint, {
                method: mode === 'create' ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim() || undefined,
                    content: content.trim(),
                    tags,
                    excerpt,
                }),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Erreur lors de la sauvegarde')
            }

            toast.success(mode === 'create' ? 'Billet publié !' : 'Modifications enregistrées !', {
                duration: 4000
            })
            router.push('/billets')
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erreur'
            setError(msg)
            toast.error(msg)
        } finally {
            setIsSaving(false)
        }
    }, [content, title, tags, excerpt, mode, initialData, router])

    // Preview
    useEffect(() => {
        if (!showPreview) return
        const compile = async () => {
            try {
                let md = content || ''
                md = md.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, slug, alias) => `[${alias}](/billets/${slug})`)
                md = md.replace(/\[\[([^\]]+)\]\]/g, (_, slug) => `[${slug}](/billets/${slug})`)
                md = md.replace(/<Cite\s+[^>]*item=["']([^"']+)["'][^>]*\/?>/gi, (_, key) => `[*${key}*]`)
                const file = await remark().use(html).process(md)
                setPreviewHtml(String(file))
            } catch {
                setPreviewHtml('<p class="text-red-600">Erreur</p>')
            }
        }
        compile()
    }, [content, showPreview])

    // Immersive mode controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isImmersive) {
                e.preventDefault()
                exitImmersive()
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                handleSave()
            }
        }

        if (isImmersive) {
            document.body.classList.add('salle-du-temps-active')
            const showExit = () => {
                setShowExitButton(true)
                if (hideExitTimerRef.current) clearTimeout(hideExitTimerRef.current)
                hideExitTimerRef.current = setTimeout(() => setShowExitButton(false), 2000)
            }
            window.addEventListener('mousemove', showExit, { passive: true })
            window.addEventListener('keydown', handleKeyDown, true)
            showExit()
            return () => {
                window.removeEventListener('mousemove', showExit)
                window.removeEventListener('keydown', handleKeyDown, true)
            }
        } else {
            document.body.classList.remove('salle-du-temps-active')
        }
    }, [isImmersive, handleSave])

    const enterImmersive = async () => {
        setIsImmersive(true)
        try {
            await document.documentElement.requestFullscreen?.()
        } catch { }
    }

    const exitImmersive = async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen()
        } catch { }
        setIsImmersive(false)
    }

    // CodeMirror extensions
    const extensions = useMemo(() => {
        const bg = nightMode ? '#002b36' : '#fdf6e3'
        const fg = nightMode ? '#839496' : '#657b83'
        const cursor = nightMode ? '#93a1a1' : '#586e75'

        return [
            markdown(),
            EditorView.lineWrapping,
            EditorView.theme({
                '&': {
                    fontSize: isImmersive ? '18px' : '16px',
                    height: '100%',
                    backgroundColor: isImmersive ? bg : 'transparent',
                },
                '.cm-content': {
                    padding: isImmersive ? '50vh 15% 50vh 15%' : '2rem',
                    caretColor: cursor,
                    backgroundColor: isImmersive ? bg : 'transparent',
                    color: fg,
                    minHeight: isImmersive ? '100vh' : '100%',
                    maxWidth: isImmersive ? '72ch' : 'none',
                    margin: isImmersive ? '0 auto' : '0',
                    fontFamily: isImmersive
                        ? 'var(--font-ia-writer, Georgia, serif)'
                        : 'ui-monospace, SFMono-Regular, monospace',
                    lineHeight: isImmersive ? '1.8' : '1.6',
                },
                '.cm-focused': { outline: 'none' },
                '.cm-cursor': { borderLeftColor: cursor, borderLeftWidth: '2px' },
                '.cm-editor': { height: '100%', backgroundColor: isImmersive ? bg : 'transparent' },
                '.cm-scroller': {
                    height: '100%',
                    backgroundColor: isImmersive ? bg : 'transparent',
                    scrollPaddingTop: isImmersive ? '50%' : '0',
                    scrollPaddingBottom: isImmersive ? '50%' : '0',
                },
                '.cm-scroller::-webkit-scrollbar': { width: isImmersive ? '0' : '8px' },
                '.cm-gutters': { display: 'none' },
                '.cm-selectionBackground': { backgroundColor: `${nightMode ? 'rgba(147,161,161,0.15)' : 'rgba(88,110,117,0.1)'}` },
            })
        ]
    }, [isImmersive, nightMode])

    // ═══════════════════════════════════════════════════════════════════════
    // SALLE DU TEMPS (Immersive mode)
    // ═══════════════════════════════════════════════════════════════════════
    if (isImmersive) {
        const progress = Math.min(100, (stats.words / 1500) * 100)

        return (
            <div className={`salle-du-temps ${nightMode ? 'night' : ''}`}>
                {/* Exit button */}
                <button
                    onClick={exitImmersive}
                    className={`salle-exit ${showExitButton ? 'visible' : ''}`}
                    title="Quitter (Échap)"
                >
                    <X style={{ width: 20, height: 20, color: nightMode ? '#93a1a1' : '#586e75' }} />
                </button>

                {/* Night mode toggle */}
                <button
                    onClick={() => setNightMode(n => !n)}
                    className="salle-exit"
                    style={{ right: '70px', opacity: showExitButton ? 0.6 : 0 }}
                    title="Mode nuit"
                >
                    {nightMode ? '☀️' : '🌙'}
                </button>

                {/* Editor */}
                <div className="h-full w-full">
                    <CodeMirror
                        ref={editorRef}
                        value={content}
                        onChange={setContent}
                        basicSetup={{
                            lineNumbers: false,
                            foldGutter: false,
                            highlightActiveLine: false,
                        }}
                        extensions={extensions}
                        className="h-full w-full"
                        height="100%"
                    />
                </div>

                {/* Writing timer */}
                <div className="salle-timer">
                    {formatTime(writingTime)} · {stats.words} mots
                </div>

                {/* Progress bar */}
                <div className="salle-progress">
                    <div className="salle-progress-bar" style={{ width: `${progress}%` }} />
                </div>
            </div>
        )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NORMAL MODE
    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="editor-solarpunk min-h-screen flex flex-col" style={{ backgroundColor: 'var(--base3)' }}>
            {/* Header */}
            <header className="editor-header">
                <div className="flex items-center gap-6">
                    <Link
                        href="/billets"
                        className="inline-flex items-center text-sm hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--base01)' }}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Billets
                    </Link>
                    <h1 className="text-lg font-light" style={{ color: 'var(--base00)' }}>
                        {mode === 'create' ? 'φ Nouveau billet' : 'Éditer'}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Toolbar */}
                    <div className="editor-toolbar">
                        <button
                            className={`editor-tool-btn ${showPreview ? 'active' : ''}`}
                            onClick={() => setShowPreview(p => !p)}
                            title="Aperçu"
                        >
                            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <div className="editor-tool-divider" />
                        <button
                            className="editor-tool-btn"
                            onClick={() => setShowImageUpload(true)}
                            title="Image"
                        >
                            <ImageIcon className="h-4 w-4" />
                        </button>
                        <button
                            className="editor-tool-btn"
                            onClick={() => setShowCitationPicker(true)}
                            title="Citation"
                        >
                            <Quote className="h-4 w-4" />
                        </button>
                        <button
                            className="editor-tool-btn"
                            onClick={() => {
                                setSelectedTextForBacklink(getSelectedText())
                                setShowBacklinkPicker(true)
                            }}
                            title="Backlink"
                        >
                            <Link2 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Auto-save indicator */}
                    <div className={`editor-autosave ${isAutoSaving ? 'saving' : ''}`}>
                        <span className="editor-autosave-dot" />
                        {isAutoSaving ? 'Sauvegarde...' : lastSaved ? `Sauvé ${lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Non sauvé'}
                    </div>

                    {/* Salle du Temps */}
                    <button onClick={enterImmersive} className="editor-btn-primary editor-btn-salle">
                        <Sparkles className="h-4 w-4" />
                        Salle du Temps
                    </button>

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="editor-btn-primary"
                        style={{ background: 'var(--green)' }}
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSaving ? 'Publication...' : 'Publier'}
                    </button>
                </div>
            </header>

            {/* Main layout */}
            <div className="flex-1 flex">
                {/* Sidebar */}
                <aside className="editor-sidebar">
                    {/* Title */}
                    <div className="editor-sidebar-section">
                        <label className="editor-sidebar-label">
                            <FileText className="h-3 w-3" /> Titre
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Un titre évocateur..."
                            className="editor-input"
                        />
                    </div>

                    {/* Tags */}
                    <div className="editor-sidebar-section">
                        <label className="editor-sidebar-label">
                            <Hash className="h-3 w-3" /> Tags
                        </label>
                        <input
                            type="text"
                            value={tags.join(', ')}
                            onChange={e => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                            placeholder="philosophie, logique..."
                            className="editor-input"
                        />
                    </div>

                    {/* Phase indicator */}
                    <div className="editor-sidebar-section">
                        <label className="editor-sidebar-label">
                            <AlignLeft className="h-3 w-3" /> Phase
                        </label>
                        <div className="editor-phase">
                            <span className={`editor-phase-dot ${phase === 'draft' ? 'active' : ''}`} />
                            <span className={`editor-phase-line ${phase !== 'draft' ? 'filled' : ''}`} />
                            <span className={`editor-phase-dot ${phase === 'revision' ? 'active' : phase === 'ready' ? 'active' : ''}`} />
                            <span className={`editor-phase-line ${phase === 'ready' ? 'filled' : ''}`} />
                            <span className={`editor-phase-dot ${phase === 'ready' ? 'active' : ''}`} />
                        </div>
                        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--base1)' }}>
                            <span>Brouillon</span>
                            <span>Révision</span>
                            <span>Prêt</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="editor-sidebar-section">
                        <label className="editor-sidebar-label">
                            <BookOpen className="h-3 w-3" /> Statistiques
                        </label>
                        <div className="editor-stats">
                            <div className="editor-stat-row">
                                <span className="editor-stat-label">Mots</span>
                                <span className="editor-stat-value">{stats.words}</span>
                            </div>
                            <div className="editor-stat-row">
                                <span className="editor-stat-label">Lecture</span>
                                <span className="editor-stat-value">~{stats.readingTime} min</span>
                            </div>
                            <div className="editor-stat-row">
                                <span className="editor-stat-label">Citations</span>
                                <span className="editor-stat-value">{stats.citations}</span>
                            </div>
                            <div className="editor-stat-row">
                                <span className="editor-stat-label">Backlinks</span>
                                <span className="editor-stat-value">{stats.backlinks}</span>
                            </div>
                        </div>
                    </div>

                    {/* Sections ruler */}
                    {sections.length > 0 && (
                        <div className="editor-sidebar-section">
                            <label className="editor-sidebar-label">
                                <AlignLeft className="h-3 w-3" /> Sections
                            </label>
                            <div className="editor-ruler">
                                <div className="editor-ruler-track" />
                                {sections.map((s, i) => (
                                    <div
                                        key={i}
                                        className="editor-ruler-marker"
                                        style={{ paddingLeft: `${0.5 + s.level * 0.5}rem` }}
                                    >
                                        <span className="editor-ruler-label">{s.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg" style={{ background: 'rgba(220,50,47,0.1)', color: 'var(--red)' }}>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                </aside>

                {/* Main content */}
                <main className="flex-1" style={{ background: 'var(--base3)' }}>
                    {showPreview ? (
                        <div className="max-w-3xl mx-auto p-8">
                            <article className="prose prose-lg" style={{ color: 'var(--base00)' }}>
                                <h1>{title || 'Sans titre'}</h1>
                                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                            </article>
                        </div>
                    ) : (
                        <div className="h-full">
                            <CodeMirror
                                ref={editorRef}
                                value={content}
                                onChange={setContent}
                                basicSetup={{
                                    lineNumbers: false,
                                    foldGutter: false,
                                    highlightActiveLine: true,
                                }}
                                extensions={extensions}
                                placeholder="Commencez à écrire..."
                                className="h-full"
                                height="100%"
                            />
                        </div>
                    )}
                </main>
            </div>

            {/* Modals */}
            {showImageUpload && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Ajouter une image</h3>
                            <button onClick={() => setShowImageUpload(false)} className="p-1 hover:bg-gray-100 rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <ImageUpload
                            onImageUploaded={(_, md) => {
                                insertAtCursor(md)
                                setShowImageUpload(false)
                            }}
                            autoInsert={false}
                        />
                    </div>
                </div>
            )}

            <CitationPicker
                isOpen={showCitationPicker}
                onClose={() => setShowCitationPicker(false)}
                onCitationSelect={key => {
                    insertAtCursor(`<Cite item="${key}" />`)
                    setShowCitationPicker(false)
                }}
            />

            <BacklinkPicker
                isOpen={showBacklinkPicker}
                onClose={() => setShowBacklinkPicker(false)}
                onSelect={(slug, alias) => {
                    insertAtCursor(alias ? `[[${slug}|${alias}]]` : `[[${slug}]]`)
                    setShowBacklinkPicker(false)
                }}
                selectedText={selectedTextForBacklink}
            />
        </div>
    )
}
