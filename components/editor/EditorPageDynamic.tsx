'use client'

import dynamic from 'next/dynamic'

// Import dynamique pour éviter les erreurs SSR avec CodeMirror
export const EditorPageDynamic = dynamic(
  () => import('./EditorPage').then(mod => ({ default: mod.EditorPage })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-subtle">Chargement de l'éditeur...</div>
      </div>
    ),
  }
)
