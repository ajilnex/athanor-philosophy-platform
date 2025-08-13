import Link from 'next/link'

export default function EditionPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-serif text-3xl text-center text-foreground mb-2">
        Maison d'édition
      </h1>
      <p className="text-center text-subtle mb-12">
        Un espace dédié à des auteur.es partenaires.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {/* Carte Auteur : Luce Lefèbvre-Goldmann */}
        <Link href="/edition/luce-lefebvre-goldmann" className="block group">
          <div className="aspect-square w-full bg-subtle/10 rounded-lg border border-subtle/20 group-hover:border-subtle/50 transition-all duration-300 flex items-center justify-center">
            <div className="text-6xl text-subtle/30">📖</div>
          </div>
          <h2 className="font-serif text-xl text-center mt-4 text-foreground group-hover:text-accent transition-colors">
            Luce Lefèbvre-Goldmann
          </h2>
        </Link>

        {/* D'autres cartes d'auteur.es pourront être ajoutées ici */}
      </div>
    </div>
  )
}