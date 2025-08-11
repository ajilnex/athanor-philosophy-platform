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

        {/* Barre de recherche (compacte et centrée) */}
        <div className="w-full max-w-lg mx-auto mt-6 mb-8">
          <form action="/search" method="GET" className="relative">
            <input
              type="search"
              name="q"
              placeholder="Rechercher..."
              className="search-input w-full p-3 pl-4 pr-10 text-base"
            />
          </form>
        </div>

        {/* Navigation mobile */}
        <nav className="flex flex-col space-y-4 sm:hidden text-foreground font-light">
          <Link href="/billets" className="hover:text-subtle transition-colors py-2">Billets</Link>
          <Link href="/publications" className="hover:text-subtle transition-colors py-2">Publications</Link>
          <Link href="/a-propos" className="hover:text-subtle transition-colors py-2">À propos</Link>
          <Link href="/search" className="hover:text-subtle transition-colors py-2">Recherche</Link>
        </nav>

        {/* Navigation desktop */}
        <nav className="hidden sm:flex space-x-6 lg:space-x-8 text-foreground font-light justify-center">
          <Link href="/billets" className="hover:text-subtle transition-colors">Billets</Link>
          <Link href="/publications" className="hover:text-subtle transition-colors">Publications</Link>
          <Link href="/a-propos" className="hover:text-subtle transition-colors">À propos</Link>
          <Link href="/search" className="hover:text-subtle transition-colors">Recherche</Link>
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
