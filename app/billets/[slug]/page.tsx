import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Tag, Lock, Download } from 'lucide-react'
import { getBilletBySlug, getBilletSlugs } from '@/lib/billets'
import { compileMDX } from '@/lib/mdx'
import { EditBilletButton } from '@/components/billets/EditBilletButton'
import { ShareButton } from '@/components/billets/ShareButton'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CommentSection } from '@/components/comments/CommentSection'
import { isFileInTrash } from '@/lib/github.server'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const billet = await getBilletBySlug(slug)

  if (!billet) return { title: 'Billet introuvable' }

  const description = billet.excerpt || `${billet.content.slice(0, 150).replace(/[#*_\[\]]/g, '')}...`

  return {
    title: `${billet.title} — L'athanor`,
    description,
    authors: [{ name: "L'athanor" }],
    openGraph: {
      title: billet.title,
      description,
      type: 'article',
      publishedTime: billet.date,
      tags: billet.tags,
      siteName: "L'athanor",
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title: billet.title,
      description,
    },
  }
}

export async function generateStaticParams() {
  const slugs = await getBilletSlugs()
  return slugs.map(slug => ({ slug }))
}

export default async function BilletPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions)
  const { slug } = await params

  // Vérifier d'abord si le billet est supprimé (dans le trash GitHub)
  const isDeleted = await isFileInTrash(`content/billets/${slug}.mdx`)
  if (isDeleted) {
    notFound()
  }

  const billet = await getBilletBySlug(slug)

  if (!billet) {
    notFound()
  }

  // Vérifier si le billet est scellé
  const billetRecord = await prisma.billet.findUnique({
    where: { slug },
  })

  const isSealed = billetRecord?.isSealed || false
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const isVisitor = !session // Mode visiteur simple

  // Si le billet est scellé et l'utilisateur n'est pas admin, interdire l'accès
  if (isSealed && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          href="/billets"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux billets
        </Link>

        <div className="text-center py-12">
          <Lock className="h-12 w-12 mx-auto mb-4 text-subtle" />
          <h1 className="text-2xl font-light text-foreground mb-2">Contenu scellé</h1>
          <p className="text-subtle mb-6">Ce billet est réservé aux administrateurs.</p>
          {!session && (
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ScholarlyArticle',
            headline: billet.title,
            datePublished: billet.date,
            author: { '@type': 'Person', name: "L'athanor" },
            publisher: { '@type': 'Organization', name: "L'athanor" },
            description: billet.excerpt || billet.content.slice(0, 150),
          }),
        }}
      />
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/billets"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux billets
        </Link>

        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-light text-foreground">{billet.title}</h1>
            <div className="ml-4 flex-shrink-0 flex items-center gap-2">
              <ShareButton title={billet.title} />
              <a
                href={`/api/billets/${slug}/download`}
                className="text-subtle hover:text-foreground underline text-sm"
              >
                <Download className="inline h-4 w-4 mr-1" /> Télécharger .md
              </a>
              <EditBilletButton
                slug={slug}
                title={billet.title}
                content={billet.content}
                tags={billet.tags}
                excerpt={billet.excerpt}
                className="flex-shrink-0"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-subtle mb-4">
            <div className="flex items-center space-x-2">
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
          </div>

          {billet.tags && billet.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-subtle" />
              <div className="flex flex-wrap gap-2">
                {billet.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 text-sm bg-gray-100 text-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <article className="max-w-none">{await compileMDX(billet.content, billet.isMdx)}</article>

      {/* Section commentaires */}
      <CommentSection targetType="billet" targetId={slug} title={billet.title} />

      {/* Ligne de pensée supprimée (MiniGraph retiré) */}

      {/* Navigation */}
      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-subtle">
        <Link
          href="/billets"
          className="text-subtle hover:text-foreground transition-colors font-light inline-flex items-center space-x-2 text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tous les billets</span>
        </Link>
      </div>
    </div>
  )
}
