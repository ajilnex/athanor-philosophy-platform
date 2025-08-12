'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-subtle/30 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand -> Home */}
        <Link href="/" className="font-serif text-lg tracking-tight hover:opacity-80">
          L'athanor
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <NavItem href="/billets">Billets</NavItem>
          <NavItem href="/publications">Publications</NavItem>
          <NavItem href="/a-propos">À propos</NavItem>
          <NavItem href="/search">Recherche</NavItem>
          {session?.user?.role === 'ADMIN' && (
            <NavItem href="/admin">Admin</NavItem>
          )}
          <NavItem href="/auth/signin">Connexion</NavItem>
        </nav>

        {/* Mobile: simple lien recherche (optionnel) */}
        <nav className="sm:hidden">
          <Link href="/search" className="text-sm underline underline-offset-4">Recherche</Link>
        </nav>
      </div>
    </header>
  );
}
