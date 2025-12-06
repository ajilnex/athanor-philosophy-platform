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
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:bg-[var(--sol-base2)] ${className}`}
            style={{ color: copied ? 'var(--sol-green)' : 'var(--sol-base01)' }}
            title={copied ? 'Lien copié !' : 'Partager ce billet'}
        >
            {copied ? (
                <Check className="h-5 w-5" />
            ) : (
                <Share2 className="h-5 w-5" />
            )}
        </button>
    )
}
