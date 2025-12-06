import { MetadataRoute } from 'next'
import { getAllBillets } from '@/lib/billets'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athanor.fr'

    // Pages statiques
    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
        { url: `${baseUrl}/billets`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/publications`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${baseUrl}/constellation`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
        { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ]

    // Billets dynamiques
    const billets = await getAllBillets()
    const billetPages: MetadataRoute.Sitemap = billets.map(billet => ({
        url: `${baseUrl}/billets/${billet.slug}`,
        lastModified: new Date(billet.date),
        changeFrequency: 'monthly',
        priority: 0.8,
    }))

    // Publications
    const publications = await prisma.article.findMany({ select: { id: true, updatedAt: true } })
    const pubPages: MetadataRoute.Sitemap = publications.map(pub => ({
        url: `${baseUrl}/publications/${pub.id}`,
        lastModified: pub.updatedAt,
        changeFrequency: 'yearly',
        priority: 0.7,
    }))

    return [...staticPages, ...billetPages, ...pubPages]
}
