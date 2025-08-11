'use client'

import { useState, useRef } from 'react'
import { X, Save, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'
import { ImageUpload } from './ImageUpload'

interface BilletEditorProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
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

export function BilletEditor({ isOpen, onClose, mode, initialData, onSave }: BilletEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [showPreview, setShowPreview] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)
    
    const newContent = before + text + after
    setContent(newContent)
    
    // Repositionner le curseur après le texte inséré
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const handleImageUploaded = (url: string, markdownSyntax: string) => {
    insertTextAtCursor(markdownSyntax)
    setShowImageUpload(false)
  }

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
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowImageUpload(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Image</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showPreview ? 'Éditer' : 'Preview'}</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
            </button>
          </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Résumé du billet..."
                />
              </div>
            </div>

            {/* Editor/Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenu * {showPreview && '(Preview)'}
              </label>
              
              {showPreview ? (
                <div className="w-full min-h-[400px] p-4 border border-gray-300 rounded-md prose prose-sm max-w-none bg-gray-50">
                  {/* Preview du markdown */}
                  <div dangerouslySetInnerHTML={{ 
                    __html: content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} />
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[400px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="# Votre billet en Markdown

Écrivez votre contenu ici...

Vous pouvez utiliser la **syntaxe Markdown** et insérer des images avec le bouton Image de la toolbar."
                />
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
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
      </div>
    </div>
  )
}