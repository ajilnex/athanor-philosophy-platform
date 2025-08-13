import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function DebugAuthPage() {
  const session = await getServerSession(authOptions)
  
  // Debug info côté serveur
  let dbUser = null
  let accounts = []
  
  if (session?.user?.email) {
    try {
      dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { accounts: true }
      })
      accounts = dbUser?.accounts || []
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug Authentification</h1>
      
      <div className="grid gap-6">
        {/* Session côté NextAuth */}
        <div className="p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">📋 Session NextAuth</h2>
          {session ? (
            <div className="space-y-2 font-mono text-sm">
              <p><strong>Email:</strong> {session.user?.email || 'N/A'}</p>
              <p><strong>Nom:</strong> {session.user?.name || 'N/A'}</p>
              <p><strong>ID:</strong> {(session.user as any)?.id || 'N/A'}</p>
              <p><strong>Rôle:</strong> {(session.user as any)?.role || 'N/A'}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ Aucune session</p>
          )}
        </div>

        {/* Utilisateur en base */}
        <div className="p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">🗄️ Utilisateur en base</h2>
          {dbUser ? (
            <div className="space-y-2 font-mono text-sm">
              <p><strong>Email:</strong> {dbUser.email}</p>
              <p><strong>Nom:</strong> {dbUser.name}</p>
              <p><strong>ID:</strong> {dbUser.id}</p>
              <p><strong>Rôle:</strong> {dbUser.role}</p>
              <p><strong>Créé:</strong> {dbUser.createdAt.toLocaleString('fr-FR')}</p>
              <p><strong>Comptes liés:</strong> {accounts.map(a => `${a.provider}:${a.providerAccountId}`).join(', ') || 'Aucun'}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ Utilisateur non trouvé en base</p>
          )}
        </div>

        {/* Diagnostic */}
        <div className="p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">🎯 Diagnostic</h2>
          <div className="space-y-2">
            {!session && <p className="text-red-600">❌ Pas de session NextAuth</p>}
            {session && !session.user?.email && <p className="text-red-600">❌ Session sans email</p>}
            {session && !(session.user as any)?.role && <p className="text-red-600">❌ Session sans rôle</p>}
            {session && (session.user as any)?.role !== 'ADMIN' && <p className="text-red-600">❌ Rôle incorrect: {(session.user as any)?.role}</p>}
            {dbUser && dbUser.role === 'ADMIN' && <p className="text-green-600">✅ Rôle ADMIN en base</p>}
            {accounts.length > 0 && <p className="text-green-600">✅ Comptes OAuth liés</p>}
            {session && (session.user as any)?.role === 'ADMIN' && <p className="text-green-600">✅ Session admin correcte</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">🔧 Actions</h2>
          <div className="space-x-4">
            <a 
              href="/api/auth/signin?callbackUrl=/debug-auth" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Se connecter
            </a>
            <a 
              href="/api/auth/signout?callbackUrl=/debug-auth" 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Se déconnecter
            </a>
            <a 
              href="/admin" 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Tester Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}