import Link from 'next/link'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: "Inscription - L'athanor",
  description: 'Créer un compte pour contribuer à la plateforme'
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="font-serif text-2xl tracking-tight">
            L'athanor
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Inscription
          </h2>
          <p className="mt-2 text-subtle">
            Créez un compte pour contribuer à la plateforme
          </p>
        </div>
        
        <RegisterForm />
        
        <div className="text-center space-y-2">
          <p className="text-sm text-subtle">
            Vous avez déjà un compte ?{' '}
            <Link href="/auth/signin" className="text-accent hover:underline">
              Se connecter
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