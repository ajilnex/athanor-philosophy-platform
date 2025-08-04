import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="bg-background border-b border-subtle">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-center">
          <div className="flex space-x-12">
            <Link
              href="/billets"
              className="text-foreground hover:text-subtle transition-colors font-light"
            >
              Billets
            </Link>
            <Link
              href="/publications"
              className="text-foreground hover:text-subtle transition-colors font-light"
            >
              Publications
            </Link>
            <Link
              href="/a-propos"
              className="text-foreground hover:text-subtle transition-colors font-light"
            >
              À propos
            </Link>
            <Link
              href="/admin"
              className="text-subtle hover:text-foreground transition-colors font-light text-sm"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}