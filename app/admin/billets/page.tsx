import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getBilletSlugs, getBilletBySlug } from '@/lib/billets'
import { prisma } from '@/lib/prisma'
import { Lock, Unlock, Edit3, Calendar, Tag, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SealBilletButton } from '@/components/admin/SealBilletButton'

export default async function AdminBilletsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/admin')
  }

  // Récupérer tous les billets avec leur état de scellement
  const slugs = await getBilletSlugs()
  const billets = await Promise.all(
    slugs.map(async slug => {
      const billet = await getBilletBySlug(slug)
      if (!billet) return null

      // Récupérer l'état de scellement depuis la base
      const billetRecord = await prisma.billet.findUnique({
        where: { slug },
      })

      return {
        ...billet,
        slug,
        isSealed: billetRecord?.isSealed || false,
      }
    })
  )

  const validBillets = billets.filter(
    (billet): billet is NonNullable<typeof billet> => billet !== null
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'administration
        </Link>

        <h1 className="text-3xl font-light text-foreground mb-2">Gestion des Billets</h1>
        <p className="text-subtle">
          Gérez l'accès et la visibilité de vos billets. Les billets scellés ne sont visibles que
          par les administrateurs.
        </p>
      </div>

      {validBillets.length === 0 ? (
        <div className="text-center py-12">
          <Edit3 className="h-12 w-12 mx-auto mb-4 text-subtle" />
          <h3 className="text-lg font-light text-foreground mb-2">Aucun billet trouvé</h3>
          <p className="text-subtle">Créez votre premier billet pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {validBillets.map(billet => (
            <div key={billet.slug} className="card border-subtle">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-light text-foreground">{billet.title}</h3>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-foreground rounded">
                      {billet.slug}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-subtle mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(billet.date).toLocaleString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {billet.tags && billet.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        <span>{billet.tags.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {billet.excerpt && <p className="text-subtle text-sm mb-3">{billet.excerpt}</p>}

                  <div className="flex items-center gap-4">
                    <Link
                      href={`/billets/${billet.slug}`}
                      className="text-accent hover:underline text-sm"
                    >
                      Voir le billet →
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <SealBilletButton slug={billet.slug} initialSealed={billet.isSealed} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
