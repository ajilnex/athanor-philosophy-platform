'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Moon, Sun } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function AdminSettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user?.role !== 'admin') {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <div>Chargement...</div>
  }

  if (!session || session.user?.role !== 'admin') {
    return null
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    // Ici on pourrait ajouter la logique pour persister le mode sombre
    // et l'appliquer à toute l'application
    if (!isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('darkMode', 'true')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('darkMode', 'false')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'administration
        </Link>

        <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-4">Paramètres</h1>
        <p className="text-sm sm:text-base text-subtle font-light">
          Configuration et préférences du site.
        </p>
      </div>

      <div className="card border-subtle">
        <div className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-light text-foreground mb-4 sm:mb-6">
            Apparence
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-subtle gap-3 sm:gap-0">
            <div>
              <h3 className="text-sm sm:text-base font-light text-foreground">Mode sombre</h3>
              <p className="text-xs sm:text-sm text-subtle font-light mt-1">
                Activer le thème sombre pour une meilleure lisibilité en faible luminosité
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex items-center justify-center w-12 h-6 rounded-full transition-colors ${
                isDarkMode ? 'bg-foreground' : 'bg-subtle'
              }`}
            >
              <div
                className={`absolute w-4 h-4 bg-white rounded-full transition-transform ${
                  isDarkMode ? 'translate-x-3' : '-translate-x-3'
                }`}
              />
              {isDarkMode ? (
                <Moon className="h-3 w-3 text-white absolute" />
              ) : (
                <Sun className="h-3 w-3 text-white absolute" />
              )}
            </button>
          </div>

          <div className="mt-4 sm:mt-6">
            <p className="text-xs sm:text-xs text-subtle font-light">
              Note: Le mode sombre est en cours de développement et s'appliquera à toute l'interface
              dans une future mise à jour.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
