'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Tag, FileText } from 'lucide-react'
import { useSession } from 'next-auth/react'
import type { Billet } from '@/lib/billets'
// import { EditBilletButton } from './EditBilletButton' // Supprimé : bouton éditer déplacé sur page individuelle

interface BilletsListProps {
  initialBillets: Billet[]
}

export function BilletsList({ initialBillets }: BilletsListProps) {
  const { data: session } = useSession()
  const [billets, setBillets] = useState<Billet[]>(initialBillets)

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  // Fonction de suppression instantanée (UX optimiste)
  const handleDeleteBillet = (slug: string) => {
    setBillets(prevBillets => prevBillets.filter(billet => billet.slug !== slug))
  }

  if (billets.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-subtle mx-auto mb-4" />
        <h3 className="text-lg font-light text-foreground mb-2">Aucun billet disponible</h3>
        <p className="text-subtle mb-6 font-light">Les premiers billets arriveront bientôt !</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {billets.map((billet, index) => (
        <article
          key={billet.slug}
          className="group py-6 border-b border-subtle/20 last:border-0 animate-fadeIn"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl font-light text-foreground group-hover:text-accent transition-colors duration-300">
              <Link href={`/billets/${billet.slug}`}>{billet.title}</Link>
            </h2>

            {billet.excerpt && (
              <p className="text-sm sm:text-base text-subtle leading-relaxed font-light line-clamp-2">
                {billet.excerpt}
              </p>
            )}

            <div className="flex items-center justify-between">
              <time className="text-xs sm:text-sm text-subtle/80" dateTime={billet.date}>
                {new Date(billet.date).toLocaleString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>

              <Link
                href={`/billets/${billet.slug}`}
                className="text-sm text-accent hover:underline underline-offset-4 transition-all duration-200"
                aria-label={`Lire ${billet.title}`}
              >
                Lire
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
