'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGitHubLoading, setIsGitHubLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou mot de passe incorrect')
      } else {
        // Rediriger vers la page admin ou d'accueil
        const session = await getSession()
        if (session?.user && (session.user as any).role === 'ADMIN') {
          router.push('/admin')
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setIsGitHubLoading(true)
    setError('')
    try {
      await signIn('github', {
        callbackUrl: '/',
        redirect: true,
      })
    } catch (error) {
      setError('Erreur de connexion GitHub')
      setIsGitHubLoading(false)
    }
  }

  const handleVisitorAccess = () => {
    // Créer une session visitor temporaire
    router.push('/?visitor=true')
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-subtle/30 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            placeholder="admin@athanor.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-subtle/30 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            placeholder="Entrez votre mot de passe"
          />
        </div>

        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-subtle/30"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-subtle">ou</span>
        </div>
      </div>

      <button
        onClick={handleGitHubSignIn}
        disabled={isGitHubLoading}
        className="w-full py-2 px-4 border border-subtle/30 rounded-lg text-foreground hover:bg-subtle/10 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
            clipRule="evenodd"
          />
        </svg>
        {isGitHubLoading ? 'Connexion GitHub...' : 'Continuer avec GitHub'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-subtle/30"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-subtle">ou</span>
        </div>
      </div>

      <button
        onClick={handleVisitorAccess}
        className="w-full py-2 px-4 border border-subtle/30 rounded-lg text-foreground hover:bg-subtle/10 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
        Simple visiteur
      </button>
    </div>
  )
}
