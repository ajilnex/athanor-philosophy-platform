import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { getBilletBySlug, getBilletSlugs } from '@/lib/billets'

export async function generateStaticParams() {
  const slugs = await getBilletSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function BilletPage({ params }: { params: { slug: string } }) {
  const billet = await getBilletBySlug(params.slug)

  if (!billet) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
          <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-4">
            {billet.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-subtle mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(billet.date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
          
          {billet.tags && billet.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-subtle" />
              <div className="flex flex-wrap gap-2">
                {billet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-gray-100 text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <article className="prose prose-sm sm:prose max-w-none">
        <div 
          dangerouslySetInnerHTML={{ __html: billet.content }}
          className=""
        />
      </article>

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