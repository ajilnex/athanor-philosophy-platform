'use client'

import { useState, useRef, useMemo } from 'react'
import { X, Save, Image as ImageIcon, GraduationCap, Bold, Italic, Heading, Quote, ListOrdered, Link, Eye, EyeOff } from 'lucide-react'
import { remark } from 'remark'
import html from 'remark-html'
import { ImageUpload } from './ImageUpload'
import { ShimmerButton } from '@/components/ui/ShimmerButton'
import { CitationPicker } from '@/components/editor/CitationPicker'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'

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
  title: string
  content: string
  tags: string[]
  excerpt: string
}

export function BilletEditor({ isOpen, onClose, mode, userRole, initialData, onSave }: BilletEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [tags] = useState<string[]>([]) // Champs supprimés mais nécessaires pour la compatibilité
  const [excerpt] = useState<string>('') // Champs supprimés mais nécessaires pour la compatibilité
  const [content, setContent] = useState(initialData?.content || '')
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showCitationPicker, setShowCitationPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const editorRef = useRef<any>(null)

  // Rendu markdown pour l'aperçu
  const previewHtml = useMemo(() => {
    if (!showPreview || !content.trim()) return ''
    try {
      return remark().use(html).processSync(content).toString()
    } catch (error) {
      console.error('Erreur de rendu markdown:', error)
      return '<p>Erreur de rendu markdown</p>'
    }
  }, [content, showPreview])

  // Génération automatique du slug depuis le titre
  const generateSlug = (titleText: string) => {
    const today = new Date().toISOString().split('T')[0]
    const slugFromTitle = titleText
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    return `${today}-${slugFromTitle}`
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (mode === 'create' && newTitle.trim()) {
      setSlug(generateSlug(newTitle))
    }
  }

  const insertTextAtCursor = (text: string) => {
    if (editorRef.current && editorRef.current.editor) {
      const editor = editorRef.current.editor
      const doc = editor.codemirror.getDoc()
      const cursor = doc.getCursor()
      doc.replaceRange(text, cursor)
      editor.codemirror.focus()
    } else {
      // Fallback : ajouter à la fin
      setContent(prev => prev + text)
    }
  }

  const handleImageUploaded = (url: string, markdownSyntax: string) => {
    insertTextAtCursor(markdownSyntax)
    setShowImageUpload(false)
  }

  const handleCitationSelected = (citationKey: string) => {
    insertTextAtCursor(`<Cite item="${citationKey}" />`)
    setShowCitationPicker(false)
  }

  // Configuration CodeMirror
  const extensions = [
    markdown(),
    EditorView.lineWrapping,
    EditorView.theme({
      '&': { fontSize: '14px' },
      '.cm-content': { padding: '16px', minHeight: '400px' },
      '.cm-focused': { outline: 'none' },
      '.cm-editor': { borderRadius: '8px' }
    })
  ]

  // Actions toolbar
  const insertMarkdown = (before: string, after: string = '') => {
    const selection = window.getSelection()?.toString() || ''
    const newText = before + selection + after
    const cursorPos = content.length
    const newContent = content.substring(0, cursorPos) + newText + content.substring(cursorPos)
    setContent(newContent)
  }

  const toolbarActions = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Gras' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italique' },
    { icon: Heading, action: () => insertMarkdown('## '), title: 'Titre' },
    { icon: Quote, action: () => insertMarkdown('> '), title: 'Citation' },
    { icon: ListOrdered, action: () => insertMarkdown('1. '), title: 'Liste numérotée' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), title: 'Lien' },
  ]

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Le titre et le contenu sont obligatoires')
      return
    }

    if (mode === 'create' && !slug.trim()) {
      setError('Le slug est obligatoire')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave({
        slug: mode === 'create' ? slug : initialData?.slug,
        title: title.trim(),
        content: content.trim(),
        tags: tags,
        excerpt: excerpt,
      })
      
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-light">
            {mode === 'create' ? 'Nouveau billet' : 'Éditer le billet'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            type="button"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Éditer' : 'Aperçu'}
          </button>
          <div>
          <ShimmerButton
            onClick={handleSave}
            disabled={isSaving}
            variant="primary"
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>
              {isSaving 
                ? (userRole === 'ADMIN' ? 'Sauvegarde...' : 'Envoi de la proposition...') 
                : (userRole === 'ADMIN' ? 'Sauvegarder et Publier' : 'Proposer la modification')
              }
            </span>
          </ShimmerButton>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Meta Fields - Simplifié */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="input-field w-full"
                placeholder="Titre de votre billet"
              />
            </div>

            {/* Éditeur Markdown avec preview intégré */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu *
              </label>
              
              <div className="border border-gray-300 rounded-md overflow-hidden">
                {!showPreview && (
                  <>
                    {/* Toolbar personnalisée */}
                    <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
                      {toolbarActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          title={action.title}
                          className="p-2 rounded hover:bg-gray-200 transition-colors"
                          type="button"
                        >
                          <action.icon className="h-4 w-4" />
                        </button>
                      ))}
                      <div className="w-px h-6 bg-gray-300 mx-1" />
                      <button
                        onClick={() => setShowImageUpload(true)}
                        title="Insérer une image"
                        className="p-2 rounded hover:bg-gray-200 transition-colors"
                        type="button"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowCitationPicker(true)}
                        title="Insérer une citation"
                        className="p-2 rounded hover:bg-gray-200 transition-colors"
                        type="button"
                      >
                        <GraduationCap className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Éditeur CodeMirror */}
                    <CodeMirror
                      ref={editorRef}
                      value={content}
                      onChange={(value) => setContent(value)}
                      extensions={extensions}
                      placeholder="# Votre billet en Markdown

Écrivez votre contenu ici...

Vous pouvez utiliser la **syntaxe Markdown** et insérer des images et citations avec la barre d'outils."
                    />
                  </>
                )}

                {showPreview && (
                  <div className="p-4 prose prose-sm max-w-none min-h-[400px] bg-white">
                    {content.trim() ? (
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    ) : (
                      <div className="text-gray-500 italic">
                        Saisissez du contenu pour voir l'aperçu...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Image Upload Modal */}
        {showImageUpload && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center p-8">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Ajouter une image</h3>
                <button
                  onClick={() => setShowImageUpload(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <ImageUpload 
                onImageUploaded={handleImageUploaded}
                autoInsert={false}
              />
            </div>
          </div>
        )}

        {/* Citation Picker Modal */}
        <CitationPicker
          isOpen={showCitationPicker}
          onClose={() => setShowCitationPicker(false)}
          onCitationSelect={handleCitationSelected}
        />
      </div>
    </div>
  )
}