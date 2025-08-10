'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-subtle">
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
          <NavItem href="/recherche">Recherche</NavItem>
          <NavItem href="/admin">Admin</NavItem>
        </nav>

        {/* Mobile: simple lien recherche (optionnel) */}
        <nav className="sm:hidden">
          <Link href="/recherche" className="text-sm underline underline-offset-4">Recherche</Link>
        </nav>
      </div>
    </header>
  );
}
