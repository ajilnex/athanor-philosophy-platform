import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EditorPageDynamic as EditorPage } from '@/components/editor/EditorPageDynamic'

export default async function NouveauBilletPage() {
  const session = await getServerSession(authOptions)

  // Seuls les admins peuvent créer des billets
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  return <EditorPage mode="create" userRole="ADMIN" />
}
