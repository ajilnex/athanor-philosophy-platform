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
        <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-4">Billets</h1>
        <p className="text-sm sm:text-base text-subtle max-w-3xl font-light">
          Pensées, réflexions et explorations philosophiques publiées au fil des jours. Un
          laboratoire d'idées en mouvement.
        </p>
      </div>

      {isAdmin && (
        <div className="mb-6">
          <Link
            href="/billets/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors text-sm"
          >
            <Plus className="h-4 w-4" /> Nouveau billet
          </Link>
        </div>
      )}

      <BilletsList initialBillets={billets} />
    </>
  )
}
