'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-background border-b border-subtle">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Desktop Navigation */}
        <div className="hidden md:flex justify-center py-6">
          <div className="flex space-x-8 lg:space-x-12">
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

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="text-foreground font-light text-lg">
              Athanor
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-subtle transition-colors p-2"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          
          {isOpen && (
            <div className="pb-4 space-y-2">
              <Link
                href="/billets"
                className="block text-foreground hover:text-subtle transition-colors font-light py-2"
                onClick={() => setIsOpen(false)}
              >
                Billets
              </Link>
              <Link
                href="/publications"
                className="block text-foreground hover:text-subtle transition-colors font-light py-2"
                onClick={() => setIsOpen(false)}
              >
                Publications
              </Link>
              <Link
                href="/a-propos"
                className="block text-foreground hover:text-subtle transition-colors font-light py-2"
                onClick={() => setIsOpen(false)}
              >
                À propos
              </Link>
              <Link
                href="/admin"
                className="block text-subtle hover:text-foreground transition-colors font-light text-sm py-2"
                onClick={() => setIsOpen(false)}
              >
                Admin
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}