import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EditorPageDynamic as EditorPage } from '@/components/editor/EditorPageDynamic'

export default async function NouveauBilletPage({
  searchParams,
}: {
  searchParams?: Promise<{ immersive?: string }>
}) {
  const session = await getServerSession(authOptions)

  // Seuls les admins peuvent créer des billets
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // Détecter si on doit démarrer en mode immersif
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const startImmersive = resolvedSearchParams?.immersive === 'true'

  return <EditorPage mode="create" userRole="ADMIN" startImmersive={startImmersive} />
}
