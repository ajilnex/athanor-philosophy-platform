import Link from 'next/link'
import { getAllBillets } from '@/lib/billets'
import { LatestActivityCard } from '@/components/home/LatestActivityCard'

export default async function HomePage() {
  const allBillets = await getAllBillets()
  const latestBillet = allBillets.length > 0 ? allBillets[0] : null
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6">
      <main className="max-w-2xl w-full">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground mb-4">
          L'athanor
        </h1>
        <p className="text-base sm:text-lg text-subtle font-light">
         Philosopher - Ecrire - Editer
        </p>

        {/* Barre de recherche (plus courte, centrée) */}
        <form action="/recherche" method="get" className="mt-6 mb-8">
          <label htmlFor="home-search" className="sr-only">Rechercher sur le site</label>
          <input
            id="home-search"
            name="q"
            placeholder="Rechercher sur le site…"
            className="w-full bg-transparent p-3 pl-4 text-lg border rounded-full
                       border-l-foreground/30 border-t-foreground/30 border-b-foreground/30 border-r-transparent
                       focus:border-r-foreground/30 focus:outline-none focus:ring-2 focus:ring-accent/50
                       transition-all duration-300"
            autoComplete="off"
          />
        </form>

        {/* Navigation mobile */}
        <nav className="flex flex-col space-y-4 sm:hidden text-foreground font-light">
          <Link href="/billets" className="hover:text-subtle transition-colors py-2">Billets</Link>
          <Link href="/publications" className="hover:text-subtle transition-colors py-2">Publications</Link>
          <Link href="/a-propos" className="hover:text-subtle transition-colors py-2">À propos</Link>
          <Link href="/recherche" className="hover:text-subtle transition-colors py-2">Recherche</Link>
        </nav>

        {/* Navigation desktop */}
        <nav className="hidden sm:flex space-x-6 lg:space-x-8 text-foreground font-light justify-center">
          <Link href="/billets" className="hover:text-subtle transition-colors">Billets</Link>
          <Link href="/publications" className="hover:text-subtle transition-colors">Publications</Link>
          <Link href="/a-propos" className="hover:text-subtle transition-colors">À propos</Link>
          <Link href="/recherche" className="hover:text-subtle transition-colors">Recherche</Link>
        </nav>

        {/* Dernière activité */}
        {latestBillet && (
          <div className="mt-16">
            <LatestActivityCard billet={latestBillet} />
          </div>
        )}
      </main>
    </div>
  )
}
