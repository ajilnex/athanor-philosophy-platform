'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClipFromUrl } from '@/lib/presse-papier'
import { revalidatePath } from 'next/cache'

export async function actionAddClipPublic(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    throw new Error('Admin requis')
  }
  const url = String(formData.get('url') || '').trim()
  const note = String(formData.get('note') || '').trim() || undefined
  if (!url) return { success: false, error: 'URL requise' }
  await createClipFromUrl(url, note)
  revalidatePath('/presse-papier')
  revalidatePath('/')
  return { success: true }
}
