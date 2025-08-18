'use client'

import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import {
  X,
  Save,
  Image as ImageIcon,
  GraduationCap,
  Bold,
  Italic,
  Heading,
  Quote,
  ListOrdered,
  Link,
  Eye,
  EyeOff,
  Link2,
  Clock,
  ChevronsRight,
} from 'lucide-react'
import { remark } from 'remark'
import html from 'remark-html'
import { ImageUpload } from './ImageUpload'
import { ShimmerButton } from '@/components/ui/ShimmerButton'
import { CitationPicker } from '@/components/editor/CitationPicker'
import { BacklinkPicker } from '@/components/editor/BacklinkPicker'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { useDebouncedCallback } from 'use-debounce'
import { iaWriterDuo } from './immersive-font'

// ... (interfaces BilletEditorProps, BilletData remain the same)
interface BilletEditorProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  userRole?: 'ADMIN' | 'USER'
  initialData?: {
    slug?: string
    title?: string
    content?: string
    tags?: string[]
    excerpt?: string
  }
  onSave: (data: BilletData) => Promise<void>
}

interface BilletData {
  slug?: string
  title?: string
  content: string
  tags: string[]
  excerpt: string
}

export function BilletEditor({
  isOpen,
  onClose,
  mode,
  userRole,
  initialData,
  onSave,
}: BilletEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [tags] = useState<string[]>([])
  const [excerpt] = useState<string>('')
  const [content, setContent] = useState(initialData?.content || '')
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showCitationPicker, setShowCitationPicker] = useState(false)
  const [showBacklinkPicker, setShowBacklinkPicker] = useState(false)
  const [selectedTextForBacklink, setSelectedTextForBacklink] = useState('')
  const [isImmersive, setIsImmersive] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editorRef = useRef<any>(null)
  const immersiveRef = useRef<HTMLDivElement>(null)
  const [dirty, setDirty] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Helpers d'insertion dans l'éditeur
  const insertAtCursor = useCallback((snippet: string) => {
    const view: EditorView | undefined = editorRef.current?.view
    if (!view) {
      setContent(prev => (prev ? `${prev}\n\n${snippet}` : snippet))
      setDirty(true)
      return
    }
    const { from, to } = view.state.selection.main
    view.dispatch({ changes: { from, to, insert: snippet } })
    setContent(view.state.doc.toString())
    setDirty(true)
    // Re-focus editor after modal actions
    setTimeout(() => view.focus(), 0)
  }, [])

  const getSelectedText = useCallback(() => {
    const view: EditorView | undefined = editorRef.current?.view
    if (!view) return ''
    const { from, to } = view.state.selection.main
    if (from === to) return ''
    return view.state.sliceDoc(from, to)
  }, [])

  // ... (previewHtml, generateSlug, handleTitleChange, insertTextAtCursor, etc. remain the same)

  const handleSave = useCallback(async () => {
    const hasFrontmatter = /^---[\s\S]*?---/m.test(content)
    const hasH1 = /^#\s+.+/m.test(content)

    if (!content.trim()) {
      setError('Le contenu est obligatoire')
      return
    }
    if (!title.trim() && !(hasFrontmatter || hasH1)) {
      setError('Ajoutez un Titre, un frontmatter (--- title: ... ---) ou un H1 (# Titre)')
      return
    }
    if (mode === 'create' && title.trim() && !slug.trim()) {
      setError('Le slug est obligatoire si un titre est saisi')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await onSave({
        slug: mode === 'create' ? (title.trim() ? slug : undefined) : initialData?.slug,
        title: title.trim() || undefined,
        content: content.trim(),
        tags: tags,
        excerpt: excerpt,
      })
      if (!isImmersive) onClose() // Ne pas fermer en mode immersif
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }, [content, title, slug, mode, initialData, onSave, isImmersive, onClose, tags, excerpt])

  // Auto-save logic for immersive mode
  const debouncedSave = useDebouncedCallback(() => {
    if (!dirty) return
    if (!content.trim()) return
    handleSave()
  }, 30000)

  useEffect(() => {
    if (isImmersive) {
      debouncedSave()
    }
  }, [content, dirty, isImmersive, debouncedSave])

  // Handle immersive mode side effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImmersive(false)
      }
    }

    if (isImmersive) {
      // Verrouille le scroll de la page sous-jacente et autorise le scroll de l'éditeur
      document.body.classList.add('salle-du-temps-active')
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.classList.remove('salle-du-temps-active')
    }

    return () => {
      document.body.classList.remove('salle-du-temps-active')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isImmersive])

  const extensions = useMemo(() => {
    const baseExtensions = [
      markdown(),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          fontSize: '16px',
          backgroundColor: 'transparent',
        },
        '.cm-content': {
          padding: '2rem',
          caretColor: '#000',
        },
        '.cm-focused': { outline: 'none' },
        '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#000' },
      }),
    ]

    if (isImmersive) {
      // Typewriter-like centering and smoother scroll padding in immersive mode
      baseExtensions.push(
        EditorView.theme({
          '.cm-scroller': {
            scrollPaddingTop: '50vh',
            scrollPaddingBottom: '50vh',
          },
        })
      )

      baseExtensions.push(
        EditorView.updateListener.of(update => {
          if (!editorRef.current?.view) return
          const view: EditorView = editorRef.current.view
          if (update.selectionSet || update.focusChanged) {
            const head = view.state.selection.main.head
            const rect = view.coordsAtPos(head)
            if (rect) {
              const scroller = view.scrollDOM
              const middle = scroller.clientHeight / 2
              const target = rect.top + scroller.scrollTop - middle
              // Seuillage léger pour éviter micro-ajustements permanents
              if (Math.abs(scroller.scrollTop - target) > 8) {
                scroller.scrollTo({ top: target, behavior: 'smooth' })
              }
            }
          }
        })
      )
    }

    return baseExtensions
  }, [isImmersive])

  if (!isOpen) return null

  const mainContainerClasses = isImmersive
    ? 'salle-du-temps fixed inset-0 z-50 p-4 sm:p-8 md:p-12 lg:p-20'
    : 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'

  return (
    <div
      ref={immersiveRef}
      className={
        isImmersive ? `${mainContainerClasses} ${iaWriterDuo.className}` : mainContainerClasses
      }
      style={
        isImmersive
          ? {
              backgroundColor: '#FAFAF8',
              color: 'hsl(220, 15%, 20%)',
            }
          : undefined
      }
    >
      <div
        data-testid="billet-editor"
        className={
          isImmersive
            ? 'w-full h-full flex flex-col'
            : 'bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col'
        }
      >
        {!isImmersive && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-light">
                {mode === 'create' ? 'Nouveau billet' : 'Éditer le billet'}
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                {/* Actions éditeur */}
                <button
                  type="button"
                  onClick={() => setShowImageUpload(true)}
                  className="px-3 py-1.5 text-sm border border-subtle/50 rounded hover:bg-muted transition"
                  title="Insérer une image"
                >
                  <ImageIcon className="h-4 w-4 inline mr-1" /> Image
                </button>
                <button
                  type="button"
                  onClick={() => setShowCitationPicker(true)}
                  className="px-3 py-1.5 text-sm border border-subtle/50 rounded hover:bg-muted transition"
                  title="Citer avec Zotero"
                >
                  <GraduationCap className="h-4 w-4 inline mr-1" /> Citer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTextForBacklink(getSelectedText())
                    setShowBacklinkPicker(true)
                  }}
                  className="px-3 py-1.5 text-sm border border-subtle/50 rounded hover:bg-muted transition"
                  title="Insérer un backlink"
                >
                  <Link2 className="h-4 w-4 inline mr-1" /> Backlink
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsImmersive(true)
                    try {
                      await document.documentElement.requestFullscreen?.()
                    } catch {}
                  }}
                  className="px-3 py-1.5 text-sm rounded bg-black/90 text-white hover:bg-black/80 transition flex items-center gap-2"
                  title="Entrer dans la Salle du Temps"
                >
                  <Clock className="h-4 w-4" /> Salle du Temps
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm rounded bg-foreground text-background hover:bg-foreground/90 transition flex items-center gap-2"
                  disabled={isSaving}
                  title="Enregistrer"
                >
                  <Save className="h-4 w-4" /> {isSaving ? 'Sauvegarde…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </>
        )}

        {isImmersive && (
          <button
            onClick={async () => {
              try {
                if (document.fullscreenElement) {
                  await document.exitFullscreen()
                }
              } catch {}
              setIsImmersive(false)
            }}
            className="fixed top-2 right-2 z-10 p-1 rounded bg-black/10 hover:bg-black/20 text-black transition"
            title="Quitter (Échap)"
            aria-label="Quitter la Salle du Temps"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Exit Immersive Mode Button - minimal cross only */}

        {/* Content Area */}
        <div
          className={
            isImmersive ? 'h-full w-full max-w-3xl mx-auto flex-1' : 'flex-1 overflow-hidden flex'
          }
        >
          <div className={isImmersive ? 'h-full w-full' : 'flex-1 p-6 overflow-y-auto'}>
            {!isImmersive && <>{/* Meta Fields */}</>}

            {/* CodeMirror Editor */}
            <CodeMirror
              ref={editorRef}
              value={content}
              onChange={value => {
                setContent(value)
                setDirty(true)
              }}
              basicSetup={{ lineNumbers: false, foldGutter: false, closeBrackets: false }}
              extensions={extensions}
              placeholder={isImmersive ? '...' : '# Votre billet en Markdown...'}
              className={isImmersive ? 'h-full w-full bg-transparent' : ''}
            />
          </div>
        </div>

        {/* Modals (non immersif) */}
        {!isImmersive && (
          <>
            {/* Image Upload Modal */}
            {showImageUpload && (
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center p-8">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
                  <button
                    onClick={() => setShowImageUpload(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-medium mb-4">Ajouter une image</h3>
                  <ImageUpload
                    onImageUploaded={(_url, md) => {
                      insertAtCursor(md)
                      setShowImageUpload(false)
                    }}
                    autoInsert={false}
                  />
                </div>
              </div>
            )}

            {/* Citation Picker */}
            <CitationPicker
              isOpen={showCitationPicker}
              onClose={() => setShowCitationPicker(false)}
              onCitationSelect={key => {
                insertAtCursor(`<Cite item="${key}" />`)
                setShowCitationPicker(false)
              }}
            />

            {/* Backlink Picker */}
            <BacklinkPicker
              isOpen={showBacklinkPicker}
              onClose={() => setShowBacklinkPicker(false)}
              onSelect={(slug, alias) => {
                const text = alias ? `[[${slug}|${alias}]]` : `[[${slug}]]`
                insertAtCursor(text)
                setShowBacklinkPicker(false)
              }}
              selectedText={selectedTextForBacklink}
            />
          </>
        )}
      </div>
    </div>
  )
}
