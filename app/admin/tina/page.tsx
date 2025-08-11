import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function TinaAdminPage() {
  // Vérification de l'authentification
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/admin/tina')
  }
  
  if (session.user?.role !== 'admin') {
    redirect('/admin') // Redirection vers la page admin normale avec message 403
  }

  // Redirection vers l'interface TinaCMS générée automatiquement
  redirect('/admin/index.html')
}