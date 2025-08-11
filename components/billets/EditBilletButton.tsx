'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Edit3, ExternalLink } from 'lucide-react'

interface EditBilletButtonProps {
  slug: string
  className?: string
}

export function EditBilletButton({ slug, className = "" }: EditBilletButtonProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  // Seuls les admins peuvent éditer
  if (status === 'loading') return null
  if (!session?.user || session.user.role !== 'admin') return null

  const handleEdit = async () => {
    setIsLoading(true)
    // Redirection vers TinaCMS avec le billet spécifique
    const tinaEditUrl = `/admin/index.html#/collections/billet/${slug}`
    window.open(tinaEditUrl, '_blank')
    setIsLoading(false)
  }

  return (
    <div className={`inline-flex ${className}`}>
      <button
        onClick={handleEdit}
        disabled={isLoading}
        className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm text-subtle hover:text-foreground border border-subtle hover:border-foreground transition-all duration-200 rounded-md bg-white hover:bg-gray-50"
      >
        <Edit3 className="h-4 w-4" />
        <span>{isLoading ? 'Ouverture...' : 'Éditer'}</span>
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  )
}