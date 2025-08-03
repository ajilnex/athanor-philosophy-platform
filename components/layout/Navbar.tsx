'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, BookOpen } from 'lucide-react'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary-700" />
              <span className="font-serif text-xl font-semibold text-primary-900">
                Athanor
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-primary-700 px-3 py-2 text-sm font-medium transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/articles"
              className="text-gray-700 hover:text-primary-700 px-3 py-2 text-sm font-medium transition-colors"
            >
              Articles
            </Link>
            <Link
              href="/search"
              className="text-gray-700 hover:text-primary-700 px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <Search className="h-4 w-4" />
              <span>Recherche</span>
            </Link>
            <Link
              href="/admin"
              className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Admin
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-700 p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                className="text-gray-700 hover:text-primary-700 px-3 py-2 text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                Accueil
              </Link>
              <Link
                href="/articles"
                className="text-gray-700 hover:text-primary-700 px-3 py-2 text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                Articles
              </Link>
              <Link
                href="/search"
                className="text-gray-700 hover:text-primary-700 px-3 py-2 text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                Recherche
              </Link>
              <Link
                href="/admin"
                className="text-gray-700 hover:text-primary-700 px-3 py-2 text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                Administration
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}