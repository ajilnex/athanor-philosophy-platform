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
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [showExitButton, setShowExitButton] = useState(false)

  const editorRef = useRef<any>(null)
  const immersiveRef = useRef<HTMLDivElement>(null)

  // Helpers d'insertion dans l'éditeur
  const insertAtCursor = useCallback((snippet: string) => {
    const view: EditorView | undefined = editorRef.current?.view
    if (!view) {
      setContent(prev => (prev ? `${prev}\n\n${snippet}` : snippet))
      return
    }
    const { from, to } = view.state.selection.main
    view.dispatch({ changes: { from, to, insert: snippet } })
    setContent(view.state.doc.toString())
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

  // Pas de sauvegarde auto en mode immersif (Git as CMS)

  // Generate HTML preview from Markdown (simple, non-MDX)
  useEffect(() => {
    if (!showPreview) return
    const compile = async () => {
      try {
        // Preprocess custom syntax: backlinks [[slug|alias]] and <Cite item="key" />
        let md = content || ''
        md = md.replace(
          /\[\[([^\]|]+)\|([^\]]+)\]\]/g,
          (_m, slug, alias) => `[${alias}](/billets/${slug})`
        )
        md = md.replace(/\[\[([^\]]+)\]\]/g, (_m, slug) => `[${slug}](/billets/${slug})`)
        md = md.replace(
          /<Cite\s+[^>]*item=["']([^"']+)["'][^>]*\/?>(?:<\/Cite>)?/gi,
          (_m, key) => `[*${key}*]`
        )

        const file = await remark().use(html).process(md)
        setPreviewHtml(String(file))
      } catch (e) {
        setPreviewHtml('<p class="text-red-600">Erreur de prévisualisation.</p>')
      }
    }
    compile()
  }, [content, showPreview])

  // Handle immersive mode side effects
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        // Sortir du fullscreen si actif
        if (document.fullscreenElement) {
          document
            .exitFullscreen()
            .catch(() => {})
            .finally(() => setIsImmersive(false))
        } else {
          setIsImmersive(false)
        }
      }
    }

    if (isImmersive) {
      // Cacher le header et verrouiller le scroll
      document.body.classList.add('salle-du-temps-active')
      const navbar = document.querySelector('nav')
      if (navbar) navbar.style.display = 'none'

      window.addEventListener('keydown', handleKeyDown, true)
    } else {
      // Restaurer le header
      document.body.classList.remove('salle-du-temps-active')
      const navbar = document.querySelector('nav')
      if (navbar) navbar.style.display = ''
    }

    return () => {
      document.body.classList.remove('salle-du-temps-active')
      const navbar = document.querySelector('nav')
      if (navbar) navbar.style.display = ''
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isImmersive])

  const extensions = useMemo(() => {
    const baseExtensions = [
      markdown(),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          fontSize: isImmersive ? '18px' : '15px',
          backgroundColor: isImmersive ? '#FAFAF8' : 'white',
        },
        '.cm-content': {
          padding: isImmersive ? '3rem 4rem' : '2rem',
          caretColor: '#333',
          backgroundColor: isImmersive ? '#FAFAF8' : 'white',
          minHeight: isImmersive ? '100vh' : 'auto',
          maxWidth: isImmersive ? '72ch' : 'none',
          margin: isImmersive ? '0 auto' : '0',
        },
        '.cm-focused': {
          outline: 'none',
          backgroundColor: isImmersive ? '#FAFAF8' : 'white',
        },
        '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: '#333',
          borderLeftWidth: '2px',
        },
        '.cm-editor': {
          backgroundColor: isImmersive ? '#FAFAF8' : 'white',
        },
        '.cm-scroller': {
          backgroundColor: isImmersive ? '#FAFAF8' : 'white',
          fontFamily: isImmersive ? 'var(--font-ia-writer)' : 'inherit',
          width: isImmersive ? '100vw' : 'auto',
        },
        '.cm-gutters': {
          backgroundColor: isImmersive ? '#FAFAF8' : 'white',
          border: 'none',
        },
        '.cm-line': {
          paddingLeft: '0',
          paddingRight: '0',
        },
      }),
    ]

    if (isImmersive) {
      // Typewriter-like centering and smoother scroll padding in immersive mode
      baseExtensions.push(
        EditorView.theme({
          '&': {
            backgroundColor: '#FAFAF8',
            height: '100%',
          },
          '.cm-editor': {
            backgroundColor: '#FAFAF8',
            border: 'none',
            height: '100%',
          },
          '.cm-editor.cm-focused': {
            backgroundColor: '#FAFAF8',
          },
          '.cm-scroller': {
            backgroundColor: '#FAFAF8',
            scrollPaddingTop: '50%',
            scrollPaddingBottom: '50%',
            lineHeight: '1.8',
          },
          '.cm-content': {
            backgroundColor: '#FAFAF8',
            padding: '50vh 15% 50vh 15%',
            minHeight: '100vh',
          },
          '@media (max-width: 768px)': {
            '.cm-content': {
              padding: '50vh 5% 50vh 5%',
            },
          },
          // Cacher la scrollbar pour plus d'immersion
          '.cm-scroller::-webkit-scrollbar': {
            width: '0px',
            background: 'transparent',
          },
        })
      )

      baseExtensions.push(
        EditorView.updateListener.of(update => {
          if (!editorRef.current?.view) return
          const view: EditorView = editorRef.current.view

          // Typewriter scrolling : garder le curseur au centre vertical
          if (update.selectionSet || update.docChanged) {
            const head = view.state.selection.main.head
            const coords = view.coordsAtPos(head)

            if (coords) {
              const scroller = view.scrollDOM
              const scrollerRect = scroller.getBoundingClientRect()
              const targetY = scrollerRect.height / 2
              const currentY = coords.top - scrollerRect.top

              // Scroll pour centrer le curseur
              const scrollTop = scroller.scrollTop + (currentY - targetY)
              scroller.scrollTo({
                top: scrollTop,
                behavior: 'instant', // Pas de smooth pour un vrai feeling machine à écrire
              })
            }
          }
        })
      )
    }

    return baseExtensions
  }, [isImmersive])

  if (!isOpen) return null

  const mainContainerClasses = isImmersive
    ? 'salle-du-temps fixed inset-0 z-[100] bg-[#FAFAF8]'
    : 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'

  return (
    <div
      ref={immersiveRef}
      className={
        isImmersive
          ? `${mainContainerClasses} ${iaWriterDuo.className} salle-du-temps-container`
          : mainContainerClasses
      }
      style={
        isImmersive
          ? {
              backgroundColor: '#FAFAF8',
              color: '#333',
              animation: 'salleEnter 0.3s ease-out',
            }
          : undefined
      }
    >
      <div
        data-testid="billet-editor"
        className={
          isImmersive
            ? 'w-full h-full flex flex-col bg-[#FAFAF8]'
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
                  onClick={() => setShowPreview(p => !p)}
                  className={`px-3 py-1.5 text-sm rounded border transition ${
                    showPreview
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-subtle/50 hover:bg-muted'
                  }`}
                  title="Basculer l'aperçu"
                >
                  {showPreview ? (
                    <EyeOff className="h-4 w-4 inline mr-1" />
                  ) : (
                    <Eye className="h-4 w-4 inline mr-1" />
                  )}{' '}
                  Aperçu
                </button>
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
          <>
            {/* Zone de détection pour la croix - position fixe, taille px pour rester constante */}
            <div
              className="fixed z-[90]"
              style={{ top: '20px', right: '20px', width: '24px', height: '24px' }}
              onMouseEnter={() => setShowExitButton(true)}
              onMouseLeave={() => setShowExitButton(false)}
              onTouchStart={() => setShowExitButton(true)}
            >
              <button
                onClick={async () => {
                  try {
                    if (document.fullscreenElement) {
                      await document.exitFullscreen()
                    }
                  } catch {}
                  setIsImmersive(false)
                }}
                onFocus={() => setShowExitButton(true)}
                onBlur={() => setShowExitButton(false)}
                className={`absolute top-0 right-0 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-all duration-300 ${showExitButton ? 'opacity-100' : 'opacity-0'}`}
                style={{ width: '40px', height: '40px' }}
                title="Quitter (Échap)"
                aria-label="Quitter la Salle du Temps"
              >
                <X className="text-black/60" style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
          </>
        )}

        {/* Exit Immersive Mode Button - minimal cross only */}

        {/* Content Area */}
        <div className={isImmersive ? 'h-full w-full flex-1' : 'flex-1 overflow-hidden flex'}>
          <div className={isImmersive ? 'h-full w-full' : 'flex-1 p-6 overflow-y-auto'}>
            {!isImmersive && <>{/* Meta Fields */}</>}

            {/* CodeMirror Editor */}
            <div className={isImmersive ? 'h-full w-full' : 'relative min-h-[60vh]'}>
              <CodeMirror
                ref={editorRef}
                value={content}
                onChange={value => {
                  setContent(value)
                }}
                basicSetup={{
                  lineNumbers: false,
                  foldGutter: false,
                  closeBrackets: false,
                  highlightActiveLine: false,
                  highlightActiveLineGutter: false,
                }}
                extensions={extensions}
                placeholder={''}
                className={isImmersive ? 'h-full w-full salle-editor' : 'w-full'}
                height={isImmersive ? '100%' : '70vh'}
                width={'100%'}
              />

              {/* Mini‑tuto (mode normal, vide) */}
              {!isImmersive && !showPreview && !content.trim() && (
                <div className="pointer-events-none absolute inset-0 p-6 text-left text-subtle/70">
                  <div className="max-w-2xl">
                    <p className="mb-3 text-sm">Conseils rapides:</p>
                    <ul className="text-sm space-y-1">
                      <li>
                        • Titre: <code># Mon titre</code>
                      </li>
                      <li>
                        • Gras/Italique: <code>**important**</code>, <code>*nuancé*</code>
                      </li>
                      <li>
                        • Liste: <code>- item</code>, ou <code>1. item</code>
                      </li>
                      <li>
                        • Lien: <code>[texte](https://exemple.org)</code>
                      </li>
                      <li>
                        • Backlink: <code>[[slug]]</code> ou <code>[[slug|Alias]]</code>
                      </li>
                      <li>
                        • Citation Zotero: bouton “Citer” (insère{' '}
                        <code>&lt;Cite item="clé" /&gt;</code>)
                      </li>
                      <li>
                        • Image: bouton “Image” (insère <code>![alt](url)</code>)
                      </li>
                      <li>• Aperçu: bouton “Aperçu” pour voir le rendu</li>
                    </ul>
                    <p className="mt-3 text-xs">Commencez à taper pour cacher cette aide…</p>
                  </div>
                </div>
              )}
            </div>
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

            {/* Preview Panel */}
            {showPreview && (
              <div className="p-4 prose prose-sm max-w-none bg-white border-t">
                {previewHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <div className="text-subtle italic">Prévisualisation vide…</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
