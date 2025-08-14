'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm font-light hover:text-subtle transition-colors ${active ? 'underline underline-offset-4' : ''}`}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-subtle/30 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand -> Home */}
        <Link href="/" className="font-serif text-xl tracking-tight hover:opacity-80 font-medium">
          L'athanor
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <NavItem href="/billets">Billets</NavItem>
          <NavItem href="/publications">Publications</NavItem>
          <NavItem href="/search">Recherche</NavItem>
          {session ? (
            <button 
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm font-light bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Se déconnecter
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="px-3 py-1.5 text-sm font-light bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Connexion
            </Link>
          )}
        </nav>

        {/* Mobile: simple lien recherche (optionnel) */}
        <nav className="sm:hidden">
          <Link href="/search" className="text-sm underline underline-offset-4">Recherche</Link>
        </nav>
      </div>
    </header>
  );
}
