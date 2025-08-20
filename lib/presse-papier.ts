import { prisma } from '@/lib/prisma'
import { fetchLinkPreview } from '@/lib/link-preview.server'

function isTableMissingError(err: unknown) {
  const any = err as any
  // Prisma error code P2021: table does not exist; also catch common messages
  return (
    any?.code === 'P2021' ||
    /table.*does not exist/i.test(String(any?.message || '')) ||
    /relation.*does not exist/i.test(String(any?.message || ''))
  )
}

export async function getPublishedClips(limit?: number) {
  try {
    return await prisma.pressClip.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  } catch (err) {
    if (isTableMissingError(err)) {
      console.warn(
        '[presse-papier] PressClip table missing – returning empty list (prod safe fallback)'
      )
      return []
    }
    throw err
  }
}

export async function getAllClipsAdmin() {
  try {
    return await prisma.pressClip.findMany({ orderBy: { createdAt: 'desc' } })
  } catch (err) {
    if (isTableMissingError(err)) {
      console.warn(
        '[presse-papier] PressClip table missing – admin list empty (prod safe fallback)'
      )
      return []
    }
    throw err
  }
}

export async function createClipFromUrl(url: string, note?: string, userId?: string) {
  const meta = await fetchLinkPreview(url)
  const title = meta.title || url
  try {
    return await prisma.pressClip.create({
      data: {
        url,
        title,
        description: meta.description ?? null,
        image: meta.image ?? null,
        siteName: meta.siteName ?? null,
        author: meta.author ?? null,
        note: note ?? null,
        isPublished: true,
        createdById: userId ?? null,
      },
    })
  } catch (err) {
    if (isTableMissingError(err)) {
      console.warn(
        '[presse-papier] PressClip table missing – cannot create clip (prod safe fallback)'
      )
      throw new Error('Base de données non migrée: Presse-papier indisponible pour le moment.')
    }
    throw err
  }
}

export async function deleteClip(id: string) {
  try {
    await prisma.pressClip.delete({ where: { id } })
  } catch (err) {
    if (isTableMissingError(err)) {
      console.warn('[presse-papier] PressClip table missing – delete noop')
      return
    }
    throw err
  }
}

export async function toggleClipPublished(id: string) {
  try {
    const clip = await prisma.pressClip.findUnique({ where: { id } })
    if (!clip) return null
    return await prisma.pressClip.update({
      where: { id },
      data: { isPublished: !clip.isPublished },
    })
  } catch (err) {
    if (isTableMissingError(err)) {
      console.warn('[presse-papier] PressClip table missing – toggle noop')
      return null
    }
    throw err
  }
}
