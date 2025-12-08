import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EditorPageDynamic as EditorPage } from '@/components/editor/EditorPageDynamic'

export default async function NouveauBilletPage({
  searchParams,
}: {
  searchParams?: Promise<{ immersive?: string; draft?: string }>
}) {
  const session = await getServerSession(authOptions)

  // Seuls les admins peuvent créer des billets
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // Détecter si on doit démarrer en mode immersif ou charger un brouillon
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const startImmersive = resolvedSearchParams?.immersive === 'true'
  const draftSlug = resolvedSearchParams?.draft

  return (
    <EditorPage
      mode="create"
      userRole="ADMIN"
      startImmersive={startImmersive}
      draftSlug={draftSlug}
    />
  )
}
