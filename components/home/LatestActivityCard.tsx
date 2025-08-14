import { Billet } from '@/lib/billets'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function LatestActivityCard({ billet }: { billet: Billet }) {
  return (
    <div className="w-full max-w-lg mx-auto" data-graph-shield>
      <h2 className="font-serif text-lg text-subtle mb-3 text-center">Activité récente</h2>
      <Link 
        href={`/billets/${billet.slug}`} 
        className="block p-4 group transition-all duration-300 bg-background/95 backdrop-blur-sm rounded-lg border border-subtle/10"
        data-graph-shield
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-accent transition-colors">
              {billet.title}
            </h3>
            <p className="mt-1 text-xs text-subtle">
              {new Date(billet.date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-subtle/50 transition-transform duration-300 transform group-hover:translate-x-1" />
        </div>
        
        {/* L'extrait est maintenant optionnel et plus court */}
        {billet.excerpt && (
          <div className="relative mt-3 max-h-12 overflow-hidden">
            <p className="text-sm text-foreground/70 font-light">
              {billet.excerpt}
            </p>
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>
        )}
      </Link>
    </div>
  )
}