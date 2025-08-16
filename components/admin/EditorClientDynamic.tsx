'use client'

import dynamic from 'next/dynamic'

const EditorClient = dynamic(
  () => import('./EditorClient').then(mod => ({ default: mod.EditorClient })),
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

interface EditorClientProps {
  filePath: string
  initialContent: string
  slug: string
}

export function EditorClientDynamic(props: EditorClientProps) {
  return <EditorClient {...props} />
}
