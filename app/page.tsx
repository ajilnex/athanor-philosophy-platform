import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6">
      <main className="max-w-2xl w-full">
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground mb-4">
          AUBIN ROBERT
        </h1>
        <p className="text-base sm:text-lg mb-8 sm:mb-12 text-subtle font-light">
          Philosophe – Recherche – Écriture
        </p>
        {/* Navigation for mobile */}
        <nav className="flex flex-col space-y-4 sm:hidden text-foreground font-light">
          <Link href="/billets" className="hover:text-subtle transition-colors py-2">
            Billets
          </Link>
          <Link href="/publications" className="hover:text-subtle transition-colors py-2">
            Publications
          </Link>
          <Link href="/a-propos" className="hover:text-subtle transition-colors py-2">
            À propos
          </Link>
        </nav>
        {/* Navigation for desktop */}
        <nav className="hidden sm:flex space-x-6 lg:space-x-8 text-foreground font-light justify-center">
          <Link href="/billets" className="hover:text-subtle transition-colors">
            Billets
          </Link>
          <Link href="/publications" className="hover:text-subtle transition-colors">
            Publications
          </Link>
          <Link href="/a-propos" className="hover:text-subtle transition-colors">
            À propos
          </Link>
        </nav>
      </main>
    </div>
  )
}