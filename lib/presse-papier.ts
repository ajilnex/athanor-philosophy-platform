import { prisma } from '@/lib/prisma'
import { fetchLinkPreview } from '@/lib/link-preview.server'

export async function getPublishedClips(limit?: number) {
  return prisma.pressClip.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function getAllClipsAdmin() {
  return prisma.pressClip.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createClipFromUrl(url: string, note?: string, userId?: string) {
  const meta = await fetchLinkPreview(url)
  const title = meta.title || url
  return prisma.pressClip.create({
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
}

export async function deleteClip(id: string) {
  await prisma.pressClip.delete({ where: { id } })
}

export async function toggleClipPublished(id: string) {
  const clip = await prisma.pressClip.findUnique({ where: { id } })
  if (!clip) return null
  return prisma.pressClip.update({
    where: { id },
    data: { isPublished: !clip.isPublished },
  })
}
