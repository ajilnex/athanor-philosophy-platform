'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Dodecahedron } from '@/components/ui/PlatonicIcons'

export function Footer({ className = '' }: { className?: string }) {
  const { data: session } = useSession()

  return (
    <footer className={`bg-background border-t border-subtle mt-16 relative z-20 ${className}`}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Brand */}
          <div className="text-center sm:text-left">
            <Link href="/" className="font-serif text-sm tracking-tight text-foreground hover:opacity-80">
              L'athanor
            </Link>
            <p className="text-subtle text-xs mt-1">Plateforme d'édition philosophique</p>
          </div>

          {/* Center: Navigation */}
          <nav className="flex items-center gap-4 text-xs text-subtle">
            <Link href="/a-propos" className="hover:text-foreground transition-colors">
              À propos
            </Link>
            <Link href="/billets" className="hover:text-foreground transition-colors">
              Billets
            </Link>
            <Link href="/publications" className="hover:text-foreground transition-colors">
              Publications
            </Link>
            {session?.user?.role === 'ADMIN' && (
              <Link href="/admin" className="hover:text-foreground transition-colors">
                Admin
              </Link>
            )}
          </nav>

          {/* Right: Contact + Easter Egg */}
          <div className="flex items-center gap-3">
            <a
              href="mailto:aub.robert@gmail.com"
              className="text-subtle text-xs hover:text-foreground transition-colors"
            >
              aub.robert@gmail.com
            </a>
            <Link
              href="/jeux"
              className="text-[var(--sol-base1)] hover:text-[var(--sol-orange)] transition-all duration-300 hover:rotate-180 hover:scale-125"
              title="?"
            >
              <Dodecahedron className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
