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
  const debouncedSave = useDebouncedCallback(handleSave, 30000) // 30 seconds

  useEffect(() => {
    if (isImmersive) {
      debouncedSave()
    }
  }, [content, isImmersive, debouncedSave])

  // Handle immersive mode side effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImmersive(false)
      }
    }

    if (isImmersive) {
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
    ? 'salle-du-temps fixed inset-0 bg-[#FAFAF8] z-50 font-ia-writer p-4 sm:p-8 md:p-12 lg:p-20'
    : 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'

  return (
    <div className={mainContainerClasses}>
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
                {/* Exemple: quelques actions usuelles (placeholder minimal) */}
                <button
                  type="button"
                  onClick={() => setShowImageUpload(true)}
                  className="px-3 py-1.5 text-sm border border-subtle/50 rounded hover:bg-muted transition"
                  title="Insérer une image"
                >
                  <ImageIcon className="h-4 w-4 inline mr-1" /> Image
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImmersive(true)}
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

        {/* Exit Immersive Mode Button */}
        {isImmersive && (
          <button
            onClick={() => setIsImmersive(false)}
            className="fixed top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full text-black transition-colors"
            title="Quitter la Salle du Temps (Échap)"
          >
            <ChevronsRight className="h-5 w-5" />
          </button>
        )}

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
              onChange={value => setContent(value)}
              basicSetup={{ lineNumbers: false, foldGutter: false, closeBrackets: false }}
              extensions={extensions}
              placeholder={isImmersive ? '...' : '# Votre billet en Markdown...'}
              className={isImmersive ? 'h-full w-full bg-transparent' : ''}
            />
          </div>
        </div>

        {/* Modals (only render if not in immersive mode) */}
        {!isImmersive && <>{/* ... All modals like ImageUpload, CitationPicker, etc. ... */}</>}
      </div>
    </div>
  )
}
