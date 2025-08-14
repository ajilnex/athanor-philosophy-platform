'use client'

import { useState, useRef, useMemo } from 'react'
import { X, Save, Image as ImageIcon, GraduationCap } from 'lucide-react'
import { ImageUpload } from './ImageUpload'
import { ShimmerButton } from '@/components/ui/ShimmerButton'
import { CitationPicker } from '@/components/editor/CitationPicker'
import dynamic from 'next/dynamic'

// Import dynamique pour éviter les problèmes SSR
const SimpleMdeEditor = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
  loading: () => <div className="w-full min-h-[400px] bg-gray-100 animate-pulse rounded-md" />
})

// Import des styles CSS
import 'easymde/dist/easymde.min.css'

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
  const [content, setContent] = useState(initialData?.content || '')
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showCitationPicker, setShowCitationPicker] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const editorRef = useRef<any>(null)

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

  // Configuration de l'éditeur SimpleMDE
  const editorOptions = useMemo(() => {
    return {
      spellChecker: false,
      status: false,
      toolbar: [
        'bold', 'italic', 'heading', '|',
        'quote', 'unordered-list', 'ordered-list', '|',
        'link', 'horizontal-rule', '|',
        {
          name: 'insertImage',
          action: () => setShowImageUpload(true),
          className: 'fa fa-picture-o',
          title: 'Insérer une image via Cloudinary',
        },
        {
          name: 'insertCitation',
          action: () => setShowCitationPicker(true),
          className: 'fa fa-graduation-cap',
          title: 'Insérer une citation Zotero',
        },
        '|',
        'preview', 'side-by-side', 'fullscreen'
      ],
      placeholder: '# Votre billet en Markdown\n\nÉcrivez votre contenu ici...\n\nVous pouvez utiliser la **syntaxe Markdown** et insérer des images et citations avec la barre d\'outils.',
    }
  }, [])

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
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      
      await onSave({
        slug: mode === 'create' ? slug : initialData?.slug,
        title: title.trim(),
        content: content.trim(),
        tags: tagsArray,
        excerpt: excerpt.trim(),
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
        <div className="flex items-center justify-end p-4 border-b bg-gray-50">
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

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Meta Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="input-field"
                  placeholder="Titre de votre billet"
                />
              </div>
              
              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="input-field font-mono text-sm"
                    placeholder="2025-08-11-mon-billet"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input-field"
                  placeholder="philosophie, collaboration, images"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Résumé
                </label>
                <input
                  type="text"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="input-field"
                  placeholder="Résumé du billet..."
                />
              </div>
            </div>

            {/* Éditeur Markdown avec preview intégré */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu *
              </label>
              
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <SimpleMdeEditor
                  ref={editorRef}
                  value={content}
                  onChange={setContent}
                  options={editorOptions}
                  className="[&_.editor-toolbar]:bg-gray-100 [&_.CodeMirror]:min-h-[400px] [&_.CodeMirror]:font-mono [&_.CodeMirror]:text-sm"
                />
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