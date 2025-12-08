import { getAllBillets } from '@/lib/billets'
import { BilletsPageClient } from '@/components/billets/BilletsPageClient'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function BilletsPage() {
  const session = await getServerSession(authOptions)
  const allBillets = await getAllBillets()

  // Enrichir avec les infos de scellement et filtrer selon le rôle
  const billetsWithSealInfo = await Promise.all(
    allBillets.map(async billet => {
      const billetRecord = await prisma.billet.findUnique({
        where: { slug: billet.slug },
      })

      const isSealed = billetRecord?.isSealed || false
      const isAdmin = session?.user?.role === 'ADMIN'

      return {
        ...billet,
        isSealed,
        // Masquer les billets scellés pour les non-admins
        shouldHide: isSealed && !isAdmin,
      }
    })
  )

  // Filtrer les billets selon les permissions
  const visibleBillets = billetsWithSealInfo.filter(billet => !billet.shouldHide)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <BilletsPageClient initialBillets={visibleBillets} />
    </div>
  )
}
