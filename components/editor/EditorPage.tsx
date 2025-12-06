'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Image as ImageIcon,
  GraduationCap,
  Link2,
  X,
  FileText,
  Hash,
  Clock,
  Sparkles,
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
import { iaWriterDuo } from '@/components/billets/immersive-font'

interface EditorPageProps {
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

export function EditorPage({ mode, userRole, initialData, startImmersive = false, draftSlug }: EditorPageProps) {
  const router = useRouter()
  const editorRef = useRef<any>(null)
  const immersiveRef = useRef<HTMLDivElement>(null)

  // État principal
  const [title, setTitle] = useState(initialData?.title || '')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [content, setContent] = useState(initialData?.content || '')
  const [excerpt] = useState<string>(initialData?.excerpt || '')

  // États UI
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [isImmersive, setIsImmersive] = useState(false)
  const [showExitButton, setShowExitButton] = useState(false)
  const hideExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Modals
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showCitationPicker, setShowCitationPicker] = useState(false)
  const [showBacklinkPicker, setShowBacklinkPicker] = useState(false)
  const [selectedTextForBacklink, setSelectedTextForBacklink] = useState('')

  // Placeholder tutoriel MD
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

Utilisez le bouton "Insérer une image" dans la barre latérale
ou écrivez directement : ![description](url-de-image)

---

Commencez à écrire pour faire disparaître ce guide...`

  // Insertion dans l'éditeur
  const insertAtCursor = useCallback((snippet: string) => {
    const view: EditorView | undefined = editorRef.current?.view
    if (!view) {
      setContent(prev => (prev ? `${prev}\n\n${snippet}` : snippet))
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
    if (from === to) return ''
    return view.state.sliceDoc(from, to)
  }, [])

  // Sauvegarde
  const handleSave = useCallback(async () => {
    const hasFrontmatter = /^---[\s\S]*?---/m.test(content)
    const hasH1 = /^#\s+.+/m.test(content)

    if (!content.trim()) {
      setError('Le contenu est obligatoire')
      return
    }
    if (!title.trim() && !(hasFrontmatter || hasH1)) {
      setError('Ajoutez un titre ou un H1 en début de contenu')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const endpoint =
        mode === 'create' ? '/api/admin/billets' : `/api/admin/billets/${initialData?.slug}`

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
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }

      const result = await response.json()

      if (result.type === 'pull_request') {
        toast.success(`Contribution créée ! PR: ${result.pullRequest.html_url}`, { duration: 8000 })
        router.push('/billets')
      } else {
        // Pour les admins, afficher le message et rediriger vers la liste
        toast.success(
          mode === 'create'
            ? 'Billet créé ! Il apparaîtra dans quelques minutes après le déploiement.'
            : 'Billet modifié ! Les changements seront visibles dans quelques minutes.',
          { duration: 6000 }
        )
        router.push('/billets')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }, [content, title, tags, excerpt, mode, initialData, router])

  // Génération du preview HTML
  useEffect(() => {
    if (!showPreview) return
    const compile = async () => {
      try {
        let md = content || ''
        // Transformer les backlinks et citations pour le preview
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

  // Gestion du mode immersif Salle du Temps
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImmersive) {
        e.preventDefault()
        e.stopPropagation()
        if (document.fullscreenElement) {
          document
            .exitFullscreen()
            .catch(() => { })
            .finally(() => setIsImmersive(false))
        } else {
          setIsImmersive(false)
        }
      }
    }

    if (isImmersive) {
      document.body.classList.add('salle-du-temps-active')
      const navbar = document.querySelector('nav')
      if (navbar) navbar.style.display = 'none'

      const showExitTemporarily = () => {
        setShowExitButton(true)
        if (hideExitTimerRef.current) clearTimeout(hideExitTimerRef.current)
        hideExitTimerRef.current = setTimeout(() => setShowExitButton(false), 1800)
      }

      window.addEventListener('mousemove', showExitTemporarily, { passive: true })
      window.addEventListener('mousedown', showExitTemporarily, { passive: true })
      window.addEventListener('touchstart', showExitTemporarily, { passive: true })
      showExitTemporarily()
      window.addEventListener('keydown', handleKeyDown, true)
    } else {
      document.body.classList.remove('salle-du-temps-active')
      const navbar = document.querySelector('nav')
      if (navbar) navbar.style.display = ''
    }

    return () => {
      document.body.classList.remove('salle-du-temps-active')
      const navbar = document.querySelector('nav')
      if (navbar) navbar.style.display = ''
      window.removeEventListener('keydown', handleKeyDown, true)
      if (hideExitTimerRef.current) {
        clearTimeout(hideExitTimerRef.current)
        hideExitTimerRef.current = null
      }
    }
  }, [isImmersive])

  // Extensions CodeMirror
  const extensions = useMemo(() => {
    const baseExtensions = [
      markdown(),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          fontSize: isImmersive ? '18px' : '16px',
          height: '100%',
          backgroundColor: isImmersive ? '#FAFAF8' : 'transparent',
        },
        '.cm-content': {
          padding: isImmersive ? '3rem 4rem' : '2rem 3rem',
          caretColor: isImmersive ? '#333' : 'hsl(220 15% 20%)',
          backgroundColor: isImmersive ? '#FAFAF8' : 'transparent',
          minHeight: isImmersive ? '100vh' : '100%',
          maxWidth: isImmersive ? '72ch' : 'none',
          margin: isImmersive ? '0 auto' : '0',
          fontFamily: isImmersive
            ? 'var(--font-ia-writer)'
            : 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          lineHeight: isImmersive ? '1.8' : '1.7',
        },
        '.cm-focused': {
          outline: 'none',
          backgroundColor: isImmersive ? '#FAFAF8' : 'transparent',
        },
        '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: isImmersive ? '#333' : 'hsl(220 15% 20%)',
          borderLeftWidth: '2px',
        },
        '.cm-editor': {
          height: '100%',
          backgroundColor: isImmersive ? '#FAFAF8' : 'transparent',
        },
        '.cm-scroller': {
          height: '100%',
          backgroundColor: isImmersive ? '#FAFAF8' : 'transparent',
          fontFamily: isImmersive ? 'var(--font-ia-writer)' : 'inherit',
          width: isImmersive ? '100vw' : 'auto',
        },
        '.cm-gutters': {
          backgroundColor: isImmersive ? '#FAFAF8' : 'transparent',
          border: 'none',
        },
        '.cm-line': {
          paddingLeft: '0',
          paddingRight: '0',
        },
        '.cm-selectionBackground': {
          backgroundColor: isImmersive ? 'rgba(0, 0, 0, 0.08)' : 'hsl(220 90% 55% / 0.15)',
        },
        '.cm-placeholder': {
          color: 'hsl(var(--subtle) / 0.5)',
          fontStyle: 'italic',
        },
      }),
    ]

    if (isImmersive) {
      // Mode immersif avec centrage du curseur
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
          '.cm-scroller::-webkit-scrollbar': {
            width: '0px',
            background: 'transparent',
          },
        })
      )

      // Typewriter scrolling pour mode immersif
      baseExtensions.push(
        EditorView.updateListener.of(update => {
          if (!editorRef.current?.view) return
          const view: EditorView = editorRef.current.view

          if (update.selectionSet || update.docChanged) {
            const head = view.state.selection.main.head
            const coords = view.coordsAtPos(head)

            if (coords) {
              const scroller = view.scrollDOM
              const scrollerRect = scroller.getBoundingClientRect()
              const targetY = scrollerRect.height / 2
              const currentY = coords.top - scrollerRect.top

              const scrollTop = scroller.scrollTop + (currentY - targetY)
              scroller.scrollTo({
                top: scrollTop,
                behavior: 'instant',
              })
            }
          }
        })
      )
    }

    return baseExtensions
  }, [isImmersive])

  // Rendu du mode immersif
  if (isImmersive) {
    return (
      <div
        ref={immersiveRef}
        className={`salle-du-temps fixed inset-0 z-[1000] bg-[#FAFAF8] ${iaWriterDuo.className} salle-du-temps-container`}
        data-graph-shield
        style={{
          backgroundColor: '#FAFAF8',
          color: '#333',
          animation: 'salleEnter 0.3s ease-out',
        }}
      >
        <div className="w-full h-full flex flex-col bg-[#FAFAF8]">
          {/* Bouton de sortie */}
          <div
            className="fixed z-[90]"
            style={{ top: '20px', right: '20px', width: '44px', height: '44px' }}
            onMouseEnter={() => setShowExitButton(true)}
            onMouseLeave={() => {
              if (hideExitTimerRef.current) clearTimeout(hideExitTimerRef.current)
              hideExitTimerRef.current = setTimeout(() => setShowExitButton(false), 1500)
            }}
            onTouchStart={() => {
              setShowExitButton(true)
              if (hideExitTimerRef.current) clearTimeout(hideExitTimerRef.current)
              hideExitTimerRef.current = setTimeout(() => setShowExitButton(false), 2000)
            }}
          >
            <button
              onClick={async () => {
                try {
                  if (document.fullscreenElement) {
                    await document.exitFullscreen()
                  }
                } catch { }
                setIsImmersive(false)
              }}
              className={`absolute top-0 right-0 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-full transition-all duration-300 ${showExitButton ? 'opacity-100' : 'opacity-0'
                }`}
              style={{ width: '40px', height: '40px' }}
              title="Quitter (Échap)"
              aria-label="Quitter la Salle du Temps"
            >
              <X className="text-black/60" style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Éditeur immersif */}
          <div className="h-full w-full">
            <CodeMirror
              ref={editorRef}
              value={content}
              onChange={value => setContent(value)}
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                closeBrackets: false,
                highlightActiveLine: false,
                highlightActiveLineGutter: false,
              }}
              extensions={extensions}
              placeholder=""
              className="h-full w-full salle-editor"
              height="100%"
            />
          </div>
        </div>
      </div>
    )
  }

  // Rendu normal (non immersif)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header fixe */}
      <header className="border-b border-subtle/20 backdrop-blur-sm sticky top-0 z-10" style={{ backgroundColor: 'rgba(238, 232, 213, 0.9)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-6">
              <Link
                href="/billets"
                className="inline-flex items-center text-subtle hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux billets
              </Link>
              <h1 className="text-lg font-light text-foreground">
                {mode === 'create' ? 'Nouveau billet' : 'Éditer le billet'}
              </h1>
            </div>

            {/* Actions principales */}
            <div className="flex items-center gap-3">
              {/* Toggle Preview */}
              <button
                type="button"
                onClick={() => setShowPreview(p => !p)}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${showPreview
                  ? 'text-white'
                  : 'border text-foreground hover:bg-muted'
                  }`}
                style={showPreview ? { backgroundColor: 'var(--sol-base03)', color: 'var(--sol-base2)' } : { backgroundColor: 'var(--sol-base2)', borderColor: 'var(--sol-base01)' }}
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showPreview ? 'Éditer' : 'Aperçu'}
              </button>

              {/* Salle du Temps */}
              <button
                type="button"
                onClick={async () => {
                  setIsImmersive(true)
                  try {
                    await document.documentElement.requestFullscreen?.()
                  } catch { }
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all"
                style={{
                  backgroundColor: 'var(--sol-base03)',
                  color: 'var(--sol-base2)',
                  border: '1px solid var(--sol-base01)',
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Salle du Temps
              </button>

              {/* Sauvegarder */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, var(--sol-cyan), var(--sol-blue))',
                  color: 'var(--sol-base3)',
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Sauvegarde...' : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Layout principal avec sidebar */}
      <div className="flex-1 flex">
        {/* Sidebar métadonnées */}
        <aside className="w-80 border-r border-subtle/20 p-6 overflow-y-auto" style={{ backgroundColor: 'var(--sol-base2)' }}>
          <div className="space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-subtle mb-2">Titre du billet</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-subtle/50" />
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Un titre évocateur..."
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-subtle/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground placeholder-subtle/50"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-subtle mb-2">Tags</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-subtle/50" />
                <input
                  type="text"
                  value={tags.join(', ')}
                  onChange={e =>
                    setTags(
                      e.target.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="philosophie, logique..."
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-subtle/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-foreground placeholder-subtle/50"
                />
              </div>
              <p className="mt-2 text-xs text-subtle">Séparez les tags par des virgules</p>
            </div>

            {/* Outils d'insertion */}
            <div>
              <label className="block text-sm font-medium text-subtle mb-3">
                Outils d'insertion
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowImageUpload(true)}
                  className="w-full inline-flex items-center px-3 py-2 text-sm border border-subtle/30 text-foreground rounded-lg hover:bg-muted transition-all"
                  style={{ backgroundColor: 'var(--sol-base3)' }}
                >
                  <ImageIcon className="h-4 w-4 mr-2 text-subtle" />
                  Insérer une image
                </button>

                <button
                  type="button"
                  onClick={() => setShowCitationPicker(true)}
                  className="w-full inline-flex items-center px-3 py-2 text-sm border border-subtle/30 text-foreground rounded-lg hover:bg-muted transition-all"
                  style={{ backgroundColor: 'var(--sol-base3)' }}
                >
                  <GraduationCap className="h-4 w-4 mr-2 text-subtle" />
                  Citation Zotero
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTextForBacklink(getSelectedText())
                    setShowBacklinkPicker(true)
                  }}
                  className="w-full inline-flex items-center px-3 py-2 text-sm border border-subtle/30 text-foreground rounded-lg hover:bg-muted transition-all"
                  style={{ backgroundColor: 'var(--sol-base3)' }}
                >
                  <Link2 className="h-4 w-4 mr-2 text-subtle" />
                  Lien vers un billet
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        </aside>

        {/* Zone de contenu principal */}
        <main className="flex-1" style={{ backgroundColor: 'var(--sol-base3)' }}>
          {showPreview ? (
            // Mode aperçu
            <div className="max-w-4xl mx-auto p-8">
              <article className="prose prose-lg max-w-none">
                <h1>{title || 'Sans titre'}</h1>
                {tags.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {tags.map(tag => (
                      <span key={tag} className="px-2 py-1 text-xs bg-muted text-subtle rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </article>
            </div>
          ) : (
            // Mode édition
            <div className="h-full">
              <CodeMirror
                ref={editorRef}
                value={content}
                onChange={value => setContent(value)}
                basicSetup={{
                  lineNumbers: false,
                  foldGutter: false,
                  closeBrackets: true,
                  highlightActiveLine: true,
                  highlightActiveLineGutter: false,
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
          <div className="rounded-xl shadow-2xl p-6 w-full max-w-lg" style={{ backgroundColor: 'var(--sol-base3)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">Ajouter une image</h3>
              <button
                onClick={() => setShowImageUpload(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-subtle" />
              </button>
            </div>
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
          const text = alias ? `[[${slug}|${alias}]]` : `[[${slug}]]`
          insertAtCursor(text)
          setShowBacklinkPicker(false)
        }}
        selectedText={selectedTextForBacklink}
      />
    </div>
  )
}
