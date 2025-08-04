import Link from 'next/link'
import { Calendar, Tag, FileText } from 'lucide-react'
import { getAllBillets } from '@/lib/billets'

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

      {billets.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-subtle mx-auto mb-4" />
          <h3 className="text-lg font-light text-foreground mb-2">
            Aucun billet disponible
          </h3>
          <p className="text-subtle mb-6 font-light">
            Les premiers billets arriveront bientôt !
          </p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {billets.map((billet) => (
            <article
              key={billet.slug}
              className="card border-subtle"
            >
              <div className="flex flex-col space-y-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-light text-foreground mb-2">
                    <Link
                      href={`/billets/${billet.slug}`}
                      className="hover:text-subtle transition-colors"
                    >
                      {billet.title}
                    </Link>
                  </h2>
                  
                  {billet.excerpt && (
                    <p className="text-sm sm:text-base text-subtle mb-4 leading-relaxed font-light">
                      {billet.excerpt}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-subtle mb-4">
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
                      <Tag className="h-4 w-4 text-subtle" />
                      <div className="flex flex-wrap gap-2">
                        {billet.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-foreground"
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
                    className="text-foreground hover:text-subtle transition-colors font-light underline text-sm sm:text-base"
                  >
                    Lire →
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