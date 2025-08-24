'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Billet } from '@/lib/billets'
import { BilletsList } from './BilletsList'

interface BilletsPageClientProps {
  initialBillets: Billet[]
}

export function BilletsPageClient({ initialBillets }: BilletsPageClientProps) {
  const { data: session } = useSession()
  const [billets] = useState(initialBillets)

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-light text-foreground">Billets</h1>

          {isAdmin && (
            <Link
              href="/billets/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau billet</span>
            </Link>
          )}
        </div>

        <p className="text-sm sm:text-base text-subtle max-w-3xl font-light">
          Pensées, réflexions et explorations philosophiques publiées au fil des jours. Un
          laboratoire d'idées en mouvement.
        </p>
      </div>

      <BilletsList initialBillets={billets} />
    </>
  )
}
