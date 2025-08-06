import { getAllBillets } from '@/lib/billets'
import { BilletsList } from '@/components/billets/BilletsList'

export default async function BilletsPage() {
  const billets = await getAllBillets()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-4">
          Billets
        </h1>
        <p className="text-sm sm:text-base text-subtle max-w-3xl font-light">
          Pensées, réflexions et explorations philosophiques publiées au fil des jours. 
          Un laboratoire d'idées en mouvement.
        </p>
      </div>

      <BilletsList initialBillets={billets} />
    </div>
  )
}