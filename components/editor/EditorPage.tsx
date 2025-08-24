'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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
}

export function EditorPage({ mode, userRole, initialData }: EditorPageProps) {
  const router = useRouter()
  const editorRef = useRef<any>(null)

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

  // Modals
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showCitationPicker, setShowCitationPicker] = useState(false)
  const [showBacklinkPicker, setShowBacklinkPicker] = useState(false)
  const [selectedTextForBacklink, setSelectedTextForBacklink] = useState('')

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
      } else {
        toast.success('Billet sauvegardé avec succès')
      }

      // Redirection après sauvegarde
      const redirectSlug = result.slug || initialData?.slug
      router.push(`/billets/${redirectSlug}`)
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

  // Extensions CodeMirror - SANS centrage du curseur
  const extensions = [
    markdown(),
    EditorView.lineWrapping,
    EditorView.theme({
      '&': {
        fontSize: '16px',
        height: '100%',
      },
      '.cm-content': {
        padding: '2rem 3rem',
        caretColor: 'hsl(220 15% 20%)',
        minHeight: '100%',
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        lineHeight: '1.7',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'hsl(220 15% 20%)',
        borderLeftWidth: '2px',
      },
      '.cm-editor': {
        height: '100%',
      },
      '.cm-scroller': {
        height: '100%',
        fontFamily: 'inherit',
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        border: 'none',
      },
      '.cm-line': {
        paddingLeft: '0',
        paddingRight: '0',
      },
      '.cm-selectionBackground': {
        backgroundColor: 'hsl(220 90% 55% / 0.15)',
      },
    }),
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header fixe */}
      <header className="border-b border-subtle/20 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
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
                className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  showPreview
                    ? 'bg-foreground text-background hover:bg-foreground/90'
                    : 'bg-white border border-subtle/50 text-foreground hover:bg-muted'
                }`}
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {showPreview ? 'Éditer' : 'Aperçu'}
              </button>

              {/* Sauvegarder */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Layout principal avec sidebar */}
      <div className="flex-1 flex">
        {/* Sidebar métadonnées */}
        <aside className="w-80 border-r border-subtle/20 bg-white p-6 overflow-y-auto">
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
                  className="w-full inline-flex items-center px-3 py-2 text-sm bg-white border border-subtle/30 text-foreground rounded-lg hover:bg-muted transition-all"
                >
                  <ImageIcon className="h-4 w-4 mr-2 text-subtle" />
                  Insérer une image
                </button>

                <button
                  type="button"
                  onClick={() => setShowCitationPicker(true)}
                  className="w-full inline-flex items-center px-3 py-2 text-sm bg-white border border-subtle/30 text-foreground rounded-lg hover:bg-muted transition-all"
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
                  className="w-full inline-flex items-center px-3 py-2 text-sm bg-white border border-subtle/30 text-foreground rounded-lg hover:bg-muted transition-all"
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
        <main className="flex-1 bg-white">
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
                placeholder="Commencez à écrire votre billet..."
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
