import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getBilletBySlug } from '@/lib/billets'
import { EditorPageDynamic as EditorPage } from '@/components/editor/EditorPageDynamic'

export default async function EditerBilletPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions)
  const { slug } = await params

  // Vérifier l'authentification
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const userRole = (session.user as any).role
  if (userRole === 'VISITOR') {
    redirect('/billets')
  }

  // Récupérer le billet
  const billet = await getBilletBySlug(slug)
  if (!billet) {
    notFound()
  }

  return (
    <EditorPage
      mode="edit"
      userRole={userRole}
      initialData={{
        slug: billet.slug,
        title: billet.title,
        content: billet.content,
        tags: billet.tags || [],
        excerpt: billet.excerpt,
      }}
    />
  )
}
