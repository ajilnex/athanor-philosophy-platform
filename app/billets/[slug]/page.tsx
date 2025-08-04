import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { getBilletBySlug, getBilletSlugs } from '@/lib/billets'

export async function generateStaticParams() {
  const slugs = getBilletSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function BilletPage({ params }: { params: { slug: string } }) {
  const billet = await getBilletBySlug(params.slug)

  if (!billet) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/billets"
          className="inline-flex items-center text-primary-700 hover:text-primary-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux billets
        </Link>
        
        <div className="mb-6">
          <h1 className="text-4xl font-serif font-bold text-primary-900 mb-4">
            {billet.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
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
              <Tag className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {billet.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-full"
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
      <article className="prose prose-lg max-w-none">
        <div 
          dangerouslySetInnerHTML={{ __html: billet.content }}
          className="prose-headings:font-serif prose-headings:text-primary-900 prose-a:text-primary-700 prose-a:no-underline hover:prose-a:underline"
        />
      </article>

      {/* Navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          href="/billets"
          className="btn-secondary inline-flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tous les billets</span>
        </Link>
      </div>
    </div>
  )
}