import Link from 'next/link'
import { Calendar, Tag, FileText } from 'lucide-react'
import { getAllBillets } from '@/lib/billets'

export default async function BilletsPage() {
  const billets = await getAllBillets()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-primary-900 mb-4">
          Billets
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Pensées, réflexions et explorations philosophiques publiées au fil des jours. 
          Un laboratoire d'idées en mouvement.
        </p>
      </div>

      {billets.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Aucun billet disponible
          </h3>
          <p className="text-gray-500 mb-6">
            Les premiers billets arriveront bientôt !
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {billets.map((billet) => (
            <article
              key={billet.slug}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex flex-col space-y-4">
                <div>
                  <h2 className="text-2xl font-serif font-semibold text-primary-900 mb-2">
                    <Link
                      href={`/billets/${billet.slug}`}
                      className="hover:text-primary-700 transition-colors"
                    >
                      {billet.title}
                    </Link>
                  </h2>
                  
                  {billet.excerpt && (
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {billet.excerpt}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-1">
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
                            className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <Link
                    href={`/billets/${billet.slug}`}
                    className="btn-primary inline-flex items-center"
                  >
                    Lire le billet
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}