'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export function Footer({ className = '' }: { className?: string }) {
  const { data: session } = useSession()

  return (
    <footer className={`bg-background border-t border-subtle mt-16 relative z-20 ${className}`}>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-subtle text-sm font-light">
            <a
              href="mailto:aub.robert@gmail.com"
              className="hover:text-foreground transition-colors"
            >
              aub.robert@gmail.com
            </a>
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link
              href="/a-propos"
              className="text-subtle text-xs hover:text-foreground transition-colors"
            >
              À propos
            </Link>
            {session?.user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-subtle text-xs hover:text-foreground transition-colors"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
