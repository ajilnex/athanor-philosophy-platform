'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { createClipFromUrl, deleteClip, toggleClipPublished } from '@/lib/presse-papier'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    throw new Error('Authentification admin requise')
  }
  return session
}

export async function actionAddClip(formData: FormData) {
  await requireAdmin()
  const url = String(formData.get('url') || '').trim()
  const note = String(formData.get('note') || '').trim() || undefined
  if (!url) return { success: false, error: 'URL requise' }
  try {
    await createClipFromUrl(url, note)
    revalidatePath('/admin/presse-papier')
    revalidatePath('/presse-papier')
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    return { success: false, error: "Impossible d'ajouter le lien" }
  }
}

export async function actionDeleteClip(id: string) {
  await requireAdmin()
  await deleteClip(id)
  revalidatePath('/admin/presse-papier')
  revalidatePath('/presse-papier')
  revalidatePath('/')
}

export async function actionToggleClipPublished(id: string) {
  await requireAdmin()
  await toggleClipPublished(id)
  revalidatePath('/admin/presse-papier')
  revalidatePath('/presse-papier')
  revalidatePath('/')
}
