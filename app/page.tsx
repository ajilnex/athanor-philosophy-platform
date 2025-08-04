import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
      <main className="max-w-2xl">
        <h1 className="text-4xl font-light tracking-tight text-foreground mb-4">
          AUBIN ROBERT
        </h1>
        <p className="text-lg mb-12 text-subtle font-light">
          Philosophe – Recherche – Écriture
        </p>
        <nav className="space-x-8 text-foreground font-light">
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