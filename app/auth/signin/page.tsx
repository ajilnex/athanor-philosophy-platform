import Link from 'next/link'
import SignInForm from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            L'athanor
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-foreground">Connexion</h2>
        </div>

        <SignInForm />

        <div className="text-center space-y-2">
          <p className="text-sm text-subtle">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-accent hover:underline">
              S'inscrire
            </Link>
          </p>
          <Link href="/" className="text-sm text-subtle hover:text-foreground block">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
