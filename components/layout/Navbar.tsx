'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { Menu, X, LogIn, LogOut } from 'lucide-react'

function NavItem({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      className={`px-3 py-2 text-sm transition-colors duration-200 ${active
        ? 'text-foreground underline underline-offset-4 decoration-1 font-medium'
        : 'text-subtle hover:text-foreground'
        } ${className || ''}`}
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => document.body.classList.remove('overflow-hidden')
  }, [open])

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--sol-base3)] sm:bg-[var(--sol-base3)]/95 sm:backdrop-blur-lg">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand -> Home */}
        <Link href="/" className="font-serif text-xl tracking-tight hover:opacity-80 font-medium text-foreground">
          L'athanor
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-2">
          <NavItem href="/mur">Mur</NavItem>
          <NavItem href="/billets">Billets</NavItem>
          <NavItem href="/publications">Publications</NavItem>
          <NavItem href="/edition">Édition</NavItem>
          <NavItem href="/constellation">Constellation</NavItem>
          <NavItem href="/archive">Archive</NavItem>
          <NavItem href="/search">Recherche</NavItem>
          {session ? (
            <button
              onClick={handleSignOut}
              title="Se déconnecter"
              className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:opacity-85 active:opacity-70 group"
              style={{
                backgroundColor: 'var(--sol-base02)',
                border: '1px solid var(--sol-base01)',
              }}
            >
              <LogOut className="w-4 h-4" style={{ color: 'var(--sol-base1)' }} />
            </button>
          ) : (
            <Link
              href="/auth/signin"
              title="Se connecter"
              className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:opacity-85 active:opacity-70 group"
              style={{
                backgroundColor: 'var(--sol-base02)',
                border: '1px solid var(--sol-base01)',
              }}
            >
              <LogIn className="w-4 h-4" style={{ color: 'var(--sol-cyan)' }} />
            </Link>
          )}
        </nav>

        {/* Mobile: hamburger */}
        <div className="sm:hidden">
          <button
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen(o => !o)}
            className="p-2 rounded-md border border-subtle/40 hover:bg-muted text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          className="sm:hidden fixed inset-0 z-[70] bg-[var(--sol-base3)] border-t border-subtle fade-in"
        >
          <div className="max-w-5xl mx-auto px-4 py-4 slide-down">
            <div className="flex items-center justify-between h-12">
              <Link
                href="/"
                className="font-serif text-lg tracking-tight text-foreground"
                onClick={() => setOpen(false)}
              >
                L'athanor
              </Link>
              <button
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md border border-subtle/40 active:scale-95 transition bg-muted text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex flex-col gap-2">
              <Link
                ref={firstLinkRef}
                href="/mur"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition text-foreground"
              >
                Mur
              </Link>
              <Link
                href="/billets"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition text-foreground"
              >
                Billets
              </Link>
              <Link
                href="/publications"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition text-foreground"
              >
                Publications
              </Link>
              <Link
                href="/edition"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition text-foreground"
              >
                Édition
              </Link>
              <Link
                href="/constellation"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition text-foreground"
              >
                Constellation
              </Link>
              <Link
                href="/archive"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition text-foreground"
              >
                Archive
              </Link>
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-base rounded hover:bg-muted transition text-foreground"
              >
                Recherche
              </Link>
              {session ? (
                <button
                  onClick={async () => {
                    setOpen(false)
                    await handleSignOut()
                  }}
                  title="Se déconnecter"
                  className="mt-4 w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-85 active:opacity-70"
                  style={{
                    backgroundColor: 'var(--sol-base02)',
                    border: '1px solid var(--sol-base01)',
                  }}
                >
                  <LogOut className="w-5 h-5" style={{ color: 'var(--sol-base1)' }} />
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setOpen(false)}
                  title="Se connecter"
                  className="mt-4 w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-85 active:opacity-70"
                  style={{
                    backgroundColor: 'var(--sol-base02)',
                    border: '1px solid var(--sol-base01)',
                  }}
                >
                  <LogIn className="w-5 h-5" style={{ color: 'var(--sol-cyan)' }} />
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
