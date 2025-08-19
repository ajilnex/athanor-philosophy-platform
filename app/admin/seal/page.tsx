import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SealBilletButton } from '@/components/admin/SealBilletButton'
import { SealPublicationButton } from '@/components/admin/SealPublicationButton'

async function getBilletsForSeal() {
  const billets = await prisma.billet.findMany({ select: { slug: true, isSealed: true } })
  return billets
}

async function getPublicationsForSeal() {
  const pubs = await prisma.article.findMany({ select: { id: true, title: true, isSealed: true } })
  return pubs
}

export default async function SealAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/admin')
  }

  const [billets, publications] = await Promise.all([getBilletsForSeal(), getPublicationsForSeal()])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-6">Sceller contenu</h1>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card border-subtle">
          <h2 className="text-lg font-light mb-4">Billets</h2>
          <ul className="space-y-2">
            {billets.map(b => (
              <li key={b.slug} className="flex items-center justify-between">
                <Link href={`/billets/${b.slug}`} className="underline">
                  {b.slug}
                </Link>
                <div className="flex items-center gap-2">
                  <SealBilletButton slug={b.slug} initialSealed={b.isSealed} />
                  <form action={`/api/admin/billets/${b.slug}`} method="post">
                    <input type="hidden" name="_method" value="DELETE" />
                    <button className="px-3 py-1 text-sm border rounded text-destructive">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card border-subtle">
          <h2 className="text-lg font-light mb-4">Publications</h2>
          <ul className="space-y-2">
            {publications.map(p => (
              <li key={p.id} className="flex items-center justify-between">
                <Link href={`/publications/${p.id}`} className="underline">
                  {p.title || p.id}
                </Link>
                <div className="flex items-center gap-2">
                  <SealPublicationButton articleId={p.id} initialSealed={p.isSealed} />
                  <form action={`/api/admin/publications/${p.id}`} method="post">
                    <input type="hidden" name="_method" value="DELETE" />
                    <button className="px-3 py-1 text-sm border rounded text-destructive">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
