'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface ShareButtonProps {
    title: string
    url?: string
    className?: string
}

export function ShareButton({ title, url, className = '' }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const shareUrl = url || window.location.href

        // Try native share API first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${title} — L'athanor`,
                    url: shareUrl,
                })
                return
            } catch {
                // User cancelled or error, fall through to clipboard
            }
        }

        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Last resort: prompt
            prompt('Copier le lien :', shareUrl)
        }
    }

    return (
        <button
            onClick={handleShare}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm text-subtle hover:text-foreground transition-colors rounded-lg hover:bg-muted ${className}`}
            title={copied ? 'Lien copié !' : 'Partager ce billet'}
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copié !</span>
                </>
            ) : (
                <>
                    <Share2 className="h-4 w-4" />
                    <span>Partager</span>
                </>
            )}
        </button>
    )
}
