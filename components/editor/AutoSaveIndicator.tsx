'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Cloud, CloudOff } from 'lucide-react'

interface AutoSaveIndicatorProps {
  isAutoSaving: boolean
  lastSaved: Date | null
  error?: string | null
}

export function AutoSaveIndicator({ isAutoSaving, lastSaved, error }: AutoSaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    if (!lastSaved) return

    const updateTimeAgo = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000)

      if (diff < 10) {
        setTimeAgo("à l'instant")
      } else if (diff < 60) {
        setTimeAgo(`il y a ${diff}s`)
      } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60)
        setTimeAgo(`il y a ${minutes}min`)
      } else {
        setTimeAgo(lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 10000) // Mise à jour toutes les 10 secondes

    return () => clearInterval(interval)
  }, [lastSaved])

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <CloudOff className="w-4 h-4" />
        <span className="text-xs">Erreur de sauvegarde</span>
      </div>
    )
  }

  if (isAutoSaving) {
    return (
      <div className="flex items-center gap-2 text-muted animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Sauvegarde...</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <div className="relative">
          <Cloud className="w-4 h-4" />
          <Check className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" />
        </div>
        <span className="text-xs">Sauvegardé {timeAgo}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-subtle/60">
      <Cloud className="w-4 h-4" />
      <span className="text-xs">Brouillon automatique</span>
    </div>
  )
}
