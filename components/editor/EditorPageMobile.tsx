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
  Sparkles,
  ChevronLeft,
  Settings,
  Type,
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
import { AutoSaveIndicator } from './AutoSaveIndicator'

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

export function EditorPageMobile({
  mode,
  userRole,
  initialData,
  draftSlug,
  startImmersive = false,
}: EditorPageProps) {
  const router = useRouter()
  const editorRef = useRef<any>(null)
  const immersiveRef = useRef<HTMLDivElement>(null)
  const didStartImmersiveRef = useRef(false)

  // État principal
  const [title, setTitle] = useState(initialData?.title || '')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [content, setContent] = useState(initialData?.content || '')
  const [excerpt] = useState<string>(initialData?.excerpt || '')

  // États UI
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

  // États mobile
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [activeToolbar, setActiveToolbar] = useState<'tools' | null>(null)

  // Modals
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showCitationPicker, setShowCitationPicker] = useState(false)
  const [showBacklinkPicker, setShowBacklinkPicker] = useState(false)
  const [selectedTextForBacklink, setSelectedTextForBacklink] = useState('')
  const [isDraftLoading, setIsDraftLoading] = useState(false)

  // Charger le brouillon si draftSlug est fourni
  useEffect(() => {
    if (!draftSlug) return

    const loadDraft = async () => {
      setIsDraftLoading(true)
      try {
        const response = await fetch(`/api/drafts/${draftSlug}`)
        if (response.ok) {
          const data = await response.json()
          if (data.draft) {
            setTitle(data.draft.title || '')
            setContent(data.draft.content || '')
            setTags(data.draft.tags || [])
            toast.success('Brouillon chargé')
          }
        }
      } catch (error) {
        console.error('Erreur chargement brouillon:', error)
        toast.error('Impossible de charger le brouillon')
      } finally {
        setIsDraftLoading(false)
      }
    }

    loadDraft()
  }, [draftSlug])

  const markdownTutorial = `# Bienvenue dans l'éditeur`

  useEffect(() => {
    if (startImmersive && !didStartImmersiveRef.current) {
      didStartImmersiveRef.current = true
      setTimeout(async () => {
        setIsImmersive(true)
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen()
          }
        } catch (err) {
          console.log('Fullscreen API non disponible:', err)
        }
        setTimeout(() => {
          if (editorRef.current?.view) {
            editorRef.current.view.focus()
          }
        }, 200)
      }, 150)
    }
  }, [startImmersive])

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

  const autoSaveDraft = useCallback(async () => {
    if (!content.trim() || isAutoSaving) return

    const effectiveTitle =
      title?.trim() ||
      content
        .split('\n')[0]
        ?.replace(/^#+\s*/, '')
        .substring(0, 50) ||
      'Brouillon sans titre'
    const normalizeSlug = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    const slug = draftSlug || initialData?.slug || normalizeSlug(effectiveTitle)

    setIsAutoSaving(true)

    try {
      const response = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title: title?.trim() || effectiveTitle,
          content: content.trim(),
          tags,
          excerpt,
        }),
      })

      if (response.ok) {
        setLastSaved(new Date())
        setError(null)
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
    } finally {
      setIsAutoSaving(false)
    }
  }, [content, title, tags, excerpt, initialData?.slug, draftSlug, isAutoSaving])

  const handlePublish = useCallback(async () => {
    const hasFrontmatter = /^---[\s\S]*?---/m.test(content)
    const hasH1 = /^#\s+.+/m.test(content)

    if (!content.trim()) {
      setError('Le contenu est obligatoire')
      if (isImmersive) {
        toast.error('Le contenu est obligatoire')
      }
      return
    }
    if (!title.trim() && !(hasFrontmatter || hasH1)) {
      const errorMsg = 'Ajoutez un titre ou un H1 en début de contenu'
      setError(errorMsg)
      if (isImmersive) {
        toast.error(errorMsg)
      }
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
        throw new Error(error.error || 'Erreur lors de la publication')
      }

      const result = await response.json()

      if (result.success && result.slug) {
        try {
          await fetch(`/api/drafts/${result.slug}`, { method: 'DELETE' })
        } catch (err) {
          console.error('Erreur suppression brouillon:', err)
        }
      }

      if (result.type === 'pull_request') {
        toast.success(`Contribution créée ! PR: ${result.pullRequest.html_url}`, { duration: 8000 })
        router.push('/billets')
      } else {
        toast.success(
          mode === 'create'
            ? 'Billet publié ! Il apparaîtra dans quelques minutes après le déploiement.'
            : 'Billet modifié ! Les changements seront visibles dans quelques minutes.',
          { duration: 6000 }
        )
        router.push('/billets')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la publication')
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la publication')
    } finally {
      setIsSaving(false)
    }
  }, [content, title, tags, excerpt, mode, initialData, router, isImmersive])

  useEffect(() => {
    if (!showPreview) return
    const compile = async () => {
      try {
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

  const enterImmersiveMode = useCallback(async () => {
    setIsImmersive(true)
    setShowMobileSidebar(false)
    setActiveToolbar(null)
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.log('Fullscreen non disponible:', err)
    }
  }, [])

  const exitImmersiveMode = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {}
    setIsImmersive(false)
    if (startImmersive) {
      router.replace('/billets/nouveau')
    }
  }, [startImmersive, router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isImmersive) {
        e.preventDefault()
        e.stopPropagation()
        exitImmersiveMode()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isImmersive) {
        e.preventDefault()
        handlePublish()
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isImmersive) {
        setIsImmersive(false)
      }
    }

    const scheduleAutoSave = () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(() => {
        if (content.trim() && !isImmersive) {
          autoSaveDraft()
        }
        autoSaveTimerRef.current = setTimeout(() => {
          if (content.trim() && !isImmersive) {
            autoSaveDraft()
          }
        }, 30000)
      }, 5000)
    }

    if (content.trim() && !isImmersive) {
      scheduleAutoSave()
    }

    if (isImmersive) {
      document.body.classList.add('salle-du-temps-active')
    } else {
      document.body.classList.remove('salle-du-temps-active')
    }

    window.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.body.classList.remove('salle-du-temps-active')
      window.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [isImmersive, exitImmersiveMode, handlePublish, autoSaveDraft, content])

  const extensions = useMemo(() => {
    const baseExtensions = [
      markdown(),
      EditorView.lineWrapping,
      EditorView.theme({
        /* ... */
      }),
    ]
    return baseExtensions
  }, [isImmersive])

  return <div className="min-h-screen bg-background flex flex-col">{/* ... Mobile UI ... */}</div>
}
