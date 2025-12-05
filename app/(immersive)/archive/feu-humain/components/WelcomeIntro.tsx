'use client'

import React, { useState, useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'

interface WelcomeIntroProps {
    archiveTitle: string
    messageCount: number
    participantCount: number
    startYear: string
    endYear: string
    onDismiss: () => void
}

export function WelcomeIntro({
    archiveTitle,
    messageCount,
    participantCount,
    startYear,
    endYear,
    onDismiss,
}: WelcomeIntroProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Animate in after mount
        const timer = setTimeout(() => setIsVisible(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const handleDismiss = () => {
        setIsVisible(false)
        setTimeout(onDismiss, 400) // Wait for fade out animation
    }

    return (
        <div
            className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[var(--void)]/95 backdrop-blur-xl"
                onClick={handleDismiss}
            />

            {/* Content */}
            <div
                className={`relative max-w-2xl mx-4 transform transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                    }`}
            >
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute -top-12 right-0 p-2 text-[var(--text-ghost)] hover:text-[var(--text-secondary)] transition"
                    aria-label="Fermer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Main Card */}
                <div className="glass-panel rounded-2xl p-8 md:p-12">
                    {/* Header */}
                    <div className="mb-8">
                        <p className="text-[10px] text-[var(--accent)] font-mono uppercase tracking-[0.2em] mb-2">
                            Bienvenue dans l'archive
                        </p>
                        <h1 className="text-3xl md:text-4xl font-medium text-[var(--text-bright)] tracking-tight">
                            {archiveTitle}
                        </h1>
                    </div>

                    {/* Poetic/Scientific Description */}
                    <div className="space-y-6 text-[var(--text-secondary)] leading-relaxed">
                        <p className="text-lg">
                            Vous entrez dans un espace de mémoire collective. Ici sont conservés
                            <span className="text-[var(--accent)] font-mono"> {messageCount.toLocaleString()}</span> fragments
                            d'une conversation qui s'est étendue sur <span className="text-[var(--accent)] font-mono">{parseInt(endYear) - parseInt(startYear)}</span> années.
                        </p>

                        <p>
                            Ce n'est pas une simple archive. C'est un organisme textuel — une
                            topologie de pensées, d'affects et de liens tissés entre <span className="text-[var(--warm)]">{participantCount} consciences</span> à
                            travers le temps. Chaque message est un nœud dans ce réseau de significations.
                        </p>

                        <p className="text-sm text-[var(--text-tertiary)]">
                            Les données s'étendent de <span className="font-mono">{startYear}</span> à <span className="font-mono">{endYear}</span>.
                            Utilisez la timeline à gauche pour naviguer dans le temps,
                            ou laissez-vous porter par le flux.
                        </p>
                    </div>

                    {/* Stats Bar */}
                    <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] grid grid-cols-3 gap-4">
                        <div>
                            <p className="hud-label">Messages</p>
                            <p className="text-xl hud-value">{messageCount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="hud-label">Participants</p>
                            <p className="text-xl hud-value">{participantCount}</p>
                        </div>
                        <div>
                            <p className="hud-label">Période</p>
                            <p className="text-xl hud-value">{startYear}–{endYear}</p>
                        </div>
                    </div>

                    {/* Enter Button */}
                    <button
                        onClick={handleDismiss}
                        className="mt-8 w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)] text-[var(--void)] font-medium text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-[var(--accent-dim)] transition-all duration-300 group"
                    >
                        Entrer dans l'archive
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-[var(--accent)] rounded-full blur-[100px] opacity-10 pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[var(--violet)] rounded-full blur-[100px] opacity-10 pointer-events-none" />
            </div>
        </div>
    )
}
