'use client'

import dynamic from 'next/dynamic'

const BilletEditor = dynamic(
  () => import('./BilletEditor').then(mod => ({ default: mod.BilletEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mx-auto mb-4"></div>
          <p className="text-subtle">Chargement de l'éditeur...</p>
        </div>
      </div>
    ),
  }
)

interface BilletData {
  slug?: string
  title?: string
  content: string
  tags: string[]
  excerpt: string
}

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
  startImmersive?: boolean
}

export function BilletEditorDynamic(props: BilletEditorProps) {
  return <BilletEditor {...props} />
}
