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
    Hourglass,
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
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view'
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
    // Stable draft slug - generated once per session
    const [currentDraftSlug] = useState(() => draftSlug || initialData?.slug || `draft-${Date.now()}`)

    // Markdown tutorial placeholder
    const markdownTutorial = `# Bienvenue dans l'éditeur

Écrivez votre billet ici en Markdown...

## Syntaxe de base

- **Gras** : **texte important**
- *Italique* : *texte nuancé*
- Liste : utilisez - ou * au début de ligne
- Lien : [texte du lien](https://exemple.org)

## Fonctionnalités spéciales

- Backlink vers un autre billet : [[slug-du-billet]]
- Backlink avec alias : [[slug|Texte affiché]]
- Citation Zotero : <Cite item="CléBiblio" />

## Images

Utilisez le bouton dans la barre latérale
ou écrivez directement : ![description](url)

---

Commencez à écrire pour faire disparaître ce guide...`

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

    const [showExitButton, setShowExitButton] = useState(false)
    const hideExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)


    // Modals
    const [showImageUpload, setShowImageUpload] = useState(false)
    const [showCitationPicker, setShowCitationPicker] = useState(false)
    const [showBacklinkPicker, setShowBacklinkPicker] = useState(false)
    const [selectedTextForBacklink, setSelectedTextForBacklink] = useState('')

    // Computed
    const stats = useDocumentStats(content)
    const sections = useSections(content)

    // Ref to track if we already started immersive (to prevent double-trigger)
    const didStartImmersiveRef = useRef(false)

    // Auto-start immersive mode if requested
    useEffect(() => {
        if (startImmersive && !didStartImmersiveRef.current) {
            didStartImmersiveRef.current = true
            setIsImmersive(true)
            // Try fullscreen
            setTimeout(async () => {
                try {
                    await document.documentElement.requestFullscreen?.()
                } catch { }
            }, 100)
        }
    }, [startImmersive])
    // Auto-save
    useEffect(() => {
        if (!content.trim() || isImmersive) return

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current)
        }

        autoSaveTimerRef.current = setTimeout(async () => {
            setIsAutoSaving(true)
            try {
                const slug = currentDraftSlug
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
        // Couleurs Solarized Light fixes (mode nocturne supprimé)
        const bg = '#fdf6e3'
        const fg = '#657b83'
        const cursor = '#586e75'

        // Typewriter scrolling plugin - keeps cursor centered vertically when typing
        const typewriterPlugin = ViewPlugin.fromClass(class {
            update(update: ViewUpdate) {
                // Center cursor only when typing, not when selecting
                if (update.docChanged) {
                    const view = update.view
                    setTimeout(() => {
                        const head = view.state.selection.main.head
                        const coords = view.coordsAtPos(head)
                        if (coords) {
                            const scroller = view.scrollDOM
                            const scrollerRect = scroller.getBoundingClientRect()
                            const targetY = scrollerRect.height / 2
                            const currentY = coords.top - scrollerRect.top
                            const diffY = currentY - targetY
                            if (Math.abs(diffY) > 5) {
                                scroller.scrollTop += diffY
                            }
                        }
                    }, 0)
                }
            }
        })

        const baseExtensions = [
            markdown(),
            EditorView.lineWrapping,
            EditorView.theme({
                '&': {
                    fontSize: isImmersive ? '18px' : '16px',
                    height: '100%',
                    backgroundColor: bg,
                },
                '.cm-scroller': {
                    height: '100%',
                    backgroundColor: bg,
                    overflow: 'auto',
                },
                '.cm-scroller::-webkit-scrollbar': { width: isImmersive ? '0' : '8px' },
                '.cm-content': {
                    padding: isImmersive ? '2rem 0' : '2rem',
                    paddingLeft: isImmersive ? 'max(15%, calc(50% - 36ch))' : '2rem',
                    paddingRight: isImmersive ? 'max(15%, calc(50% - 36ch))' : '2rem',
                    marginTop: isImmersive ? '45vh' : '0',
                    marginBottom: isImmersive ? '45vh' : '0',
                    caretColor: cursor,
                    backgroundColor: bg,
                    color: fg,
                    minHeight: isImmersive ? '10vh' : '100%',
                    maxWidth: 'none',
                    fontFamily: isImmersive
                        ? 'var(--font-ia-writer, Georgia, serif)'
                        : 'ui-monospace, SFMono-Regular, monospace',
                    lineHeight: isImmersive ? '1.8' : '1.6',
                },
                '.cm-focused': { outline: 'none', border: 'none', boxShadow: 'none' },
                '.cm-editor.cm-focused': { outline: 'none', border: 'none', boxShadow: 'none' },
                '.cm-cursor': { borderLeftColor: cursor, borderLeftWidth: '2px' },
                '.cm-editor': { height: '100%', backgroundColor: bg, border: 'none', outline: 'none' },
                '.cm-gutters': { display: 'none' },
                '.cm-activeLine': { backgroundColor: 'transparent' },
                '.cm-selectionBackground': {
                    backgroundColor: 'rgba(38, 139, 210, 0.4)'
                },
                '&.cm-focused .cm-selectionBackground': {
                    backgroundColor: 'rgba(38, 139, 210, 0.5)'
                },
                '.cm-placeholder': {
                    color: '#93a1a1',
                    fontStyle: 'italic',
                },
            })
        ]

        // Add typewriter plugin only in immersive mode
        if (isImmersive) {
            baseExtensions.push(typewriterPlugin)
        }

        return baseExtensions
    }, [isImmersive])

    // ═══════════════════════════════════════════════════════════════════════
    // SALLE DU TEMPS (Immersive mode)
    // ═══════════════════════════════════════════════════════════════════════
    if (isImmersive) {
        return (
            <div className="salle-du-temps">
                {/* Exit button - always slightly visible */}
                <button
                    onClick={exitImmersive}
                    className="salle-exit-always"
                    title="Quitter (Échap)"
                >
                    <X style={{ width: 18, height: 18 }} />
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
                            highlightSelectionMatches: false,
                            drawSelection: true,
                            dropCursor: true,
                            allowMultipleSelections: true,
                            bracketMatching: false,
                            closeBrackets: false,
                            autocompletion: false,
                            rectangularSelection: true,
                            crosshairCursor: false,
                            highlightActiveLineGutter: false,
                            history: true,
                            syntaxHighlighting: true,
                        }}
                        extensions={extensions}
                        className="h-full w-full"
                        height="100%"
                    />
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
                        {mode === 'create' ? 'Nouveau billet' : 'Éditer'}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Unified Toolbar */}
                    <div className="editor-toolbar">
                        {/* Preview toggle */}
                        <button
                            className={`editor-tool-btn ${showPreview ? 'active' : ''}`}
                            onClick={() => setShowPreview(p => !p)}
                            title="Aperçu"
                        >
                            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>

                        <div className="editor-tool-divider" />

                        {/* Insert tools */}
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

                        <div className="editor-tool-divider" />

                        {/* Salle du Temps */}
                        <button
                            className="editor-tool-btn"
                            onClick={enterImmersive}
                            title="Salle du Temps"
                            style={{ color: 'var(--cyan)' }}
                        >
                            <Hourglass className="h-4 w-4" />
                        </button>

                        <div className="editor-tool-divider" />

                        {/* Save status indicator (dot only) */}
                        <div
                            className="w-2 h-2 rounded-full mx-1"
                            style={{
                                backgroundColor: isAutoSaving ? 'var(--yellow)' : lastSaved ? 'var(--green)' : 'var(--base1)'
                            }}
                            title={isAutoSaving ? 'Sauvegarde...' : lastSaved ? `Sauvé ${lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Non sauvé'}
                        />

                        {/* Save */}
                        <button
                            className="editor-tool-btn"
                            onClick={handleSave}
                            disabled={isSaving}
                            title={isSaving ? 'Publication...' : 'Publier'}
                            style={{ color: 'var(--green)' }}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                    </div>
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
                <main className="flex-1" style={{ background: 'var(--base3)', outline: 'none' }}>
                    {showPreview ? (
                        <div className="max-w-3xl mx-auto p-8">
                            <article className="prose prose-lg" style={{ color: 'var(--base00)' }}>
                                <h1>{title || 'Sans titre'}</h1>
                                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                            </article>
                        </div>
                    ) : (
                        <div className="h-full" style={{ outline: 'none' }}>
                            <CodeMirror
                                ref={editorRef}
                                value={content}
                                onChange={setContent}
                                basicSetup={{
                                    lineNumbers: false,
                                    foldGutter: false,
                                    highlightActiveLine: true,
                                    highlightSelectionMatches: false,
                                    drawSelection: true,
                                }}
                                extensions={extensions}
                                placeholder={content ? '' : markdownTutorial}
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
