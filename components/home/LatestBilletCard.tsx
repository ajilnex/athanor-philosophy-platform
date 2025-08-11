import { Billet } from '@/lib/billets'
import Link from 'next/link'
import { Calendar } from 'lucide-react'

interface LatestBilletCardProps {
  billet: Billet
}

export function LatestBilletCard({ billet }: LatestBilletCardProps) {
  return (
    <Link 
      href={`/billets/${billet.slug}`} 
      className="block p-6 rounded-lg border border-subtle/30 bg-aurore-gradient shadow-sm hover:border-subtle/80 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-serif text-2xl font-medium text-foreground group-hover:text-accent transition-colors">
          {billet.title}
        </h3>
      </div>
      
      <div className="flex items-center space-x-2 text-sm text-subtle mb-4">
        <Calendar className="h-4 w-4" />
        <span>
          {new Date(billet.date).toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>

      <div className="relative h-20 overflow-hidden">
        <p className="text-foreground/80 font-light leading-relaxed">
          {billet.excerpt || billet.content.substring(0, 250)}...
        </p>
        {/* Le masque en dégradé qui invite au clic */}
        <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>
      
      <div className="mt-4 pt-4 border-t border-subtle/20">
        <span className="text-accent font-medium text-sm group-hover:underline">
          Lire la suite →
        </span>
      </div>
    </Link>
  )
}