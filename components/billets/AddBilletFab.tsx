'use client'

import { useState } from 'react'
import { BilletEditorDynamic as BilletEditor } from './BilletEditorDynamic'

export function AddBilletFab() {
  const [open, setOpen] = useState(false)

  const handleCreate = async (data: any) => {
    const res = await fetch('/api/admin/billets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}) as any)
      throw new Error(err?.error || 'Erreur lors de la création')
    }
    // Recharge pour voir le nouveau billet
    window.location.href = '/billets'
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full border-2 border-foreground bg-background text-foreground shadow hover:bg-foreground hover:text-background transition-colors duration-200 font-serif text-2xl leading-none"
        aria-label="Nouveau billet (Salle du Temps)"
        title="Nouveau billet"
      >
        +
      </button>
      {open && (
        <BilletEditor
          isOpen={open}
          onClose={() => setOpen(false)}
          mode="create"
          userRole="ADMIN"
          onSave={handleCreate}
          startImmersive
        />
      )}
    </>
  )
}
