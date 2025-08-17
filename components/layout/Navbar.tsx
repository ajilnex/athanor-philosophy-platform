'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm font-light hover:text-subtle transition-colors ${active ? 'underline underline-offset-4' : ''}`}
    >
      {children}
    </Link>
  )
}

export function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Close on ESC, focus management
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // focus first link
    const t = setTimeout(() => firstLinkRef.current?.focus(), 0)
    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open])

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
          <NavItem href="/presse-papier">Presse-papier</NavItem>
          <NavItem href="/search">Recherche</NavItem>
          {session ? (
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm font-light bg-slate-900/90 hover:bg-slate-800/95 text-slate-50 rounded-md transition-all duration-200 border border-slate-700/30 backdrop-blur-sm"
            >
              Se déconnecter
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="px-3 py-1.5 text-sm font-light bg-slate-900/90 hover:bg-slate-800/95 text-slate-50 rounded-md transition-all duration-200 border border-slate-700/30 backdrop-blur-sm"
            >
              Connexion
            </Link>
          )}
        </nav>

        {/* Mobile: hamburger */}
        <div className="sm:hidden">
          <button
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setOpen(o => !o)}
            className="p-2 rounded-md border border-subtle/40 hover:bg-muted"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="sm:hidden fixed inset-0 z-[60] bg-background/95 backdrop-blur-md border-t border-subtle fade-in"
        >
          <div className="max-w-5xl mx-auto px-4 py-4 slide-down">
            <div className="flex items-center justify-between h-12">
              <Link
                href="/"
                className="font-serif text-lg tracking-tight"
                onClick={() => setOpen(false)}
              >
                L'athanor
              </Link>
              <button
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md border border-subtle/40 active:scale-95 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex flex-col gap-2">
              <Link
                ref={firstLinkRef}
                href="/billets"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition"
              >
                Billets
              </Link>
              <Link
                href="/publications"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition"
              >
                Publications
              </Link>
              <Link
                href="/presse-papier"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition"
              >
                Presse‑papier
              </Link>
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition"
              >
                Recherche
              </Link>
              {session ? (
                <button
                  onClick={async () => {
                    setOpen(false)
                    await handleSignOut()
                  }}
                  className="mt-2 px-3 py-2 text-base rounded bg-slate-900/90 text-slate-50 border border-slate-700/30 active:scale-95 transition"
                >
                  Se déconnecter
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setOpen(false)}
                  className="mt-2 px-3 py-2 text-base rounded bg-slate-900/90 text-slate-50 border border-slate-700/30 active:scale-95 transition"
                >
                  Connexion
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
