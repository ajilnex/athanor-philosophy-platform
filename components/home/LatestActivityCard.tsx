import { Billet } from '@/lib/billets'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function LatestActivityCard({ billet }: { billet: Billet }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="font-serif text-xl text-subtle mb-4 text-center">Dernière activité</h2>
      <Link 
        href={`/billets/${billet.slug}`} 
        className="block p-6 rounded-xl border border-subtle/20 bg-background/50 shadow-sm backdrop-blur-sm group transition-all duration-300 hover:border-subtle/50 hover:shadow-lg"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-serif text-2xl font-medium text-foreground group-hover:text-accent transition-colors">
              {billet.title}
            </h3>
            <p className="mt-1 text-sm text-subtle">
              {new Date(billet.date).toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-subtle/50 transition-all duration-300 transform -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0 ml-4" />
        </div>
        
        <div className="relative mt-4 h-20 overflow-hidden">
          <p className="text-foreground/80 font-light leading-relaxed">
            {billet.excerpt || billet.content.substring(0, 280)}...
          </p>
          {/* Le masque en dégradé pour l'effet "fade-out" */}
          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        </div>
      </Link>
    </div>
  )
}