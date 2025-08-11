import { getAllBillets } from '@/lib/billets'
import { BilletsPageClient } from '@/components/billets/BilletsPageClient'

// Billets sont statiques (filesystem uniquement)

export default async function BilletsPage() {
  const billets = await getAllBillets()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <BilletsPageClient initialBillets={billets} />
    </div>
  )
}