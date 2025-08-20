'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClipFromUrl } from '@/lib/presse-papier'
import { revalidatePath } from 'next/cache'

export async function actionAddClipPublic(formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      throw new Error('Admin requis')
    }
    const url = String(formData.get('url') || '').trim()
    const note = String(formData.get('note') || '').trim() || undefined
    if (!url) return { success: false, error: 'URL requise' }

    console.log('🔗 Adding clip:', { url, note, userId: session.user?.id })

    await createClipFromUrl(url, note, session.user?.id)

    console.log('✅ Clip added successfully')

    revalidatePath('/presse-papier')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('❌ Error adding clip:', error)
    throw new Error(
      `Impossible d'ajouter le lien: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
    )
  }
}
