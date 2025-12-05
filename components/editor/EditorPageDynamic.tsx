'use client'

import dynamic from 'next/dynamic'

// Import dynamique pour éviter les erreurs SSR avec CodeMirror
// Using new Solarpunk design
export const EditorPageDynamic = dynamic(
  () => import('./EditorSolarpunk').then(mod => ({ default: mod.EditorSolarpunk })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf6e3' }}>
        <div style={{ color: '#93a1a1' }}>Chargement de l'éditeur...</div>
      </div>
    ),
  }
)

