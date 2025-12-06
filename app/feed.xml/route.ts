import { getAllBillets } from '@/lib/billets'

export async function GET() {
    const billets = await getAllBillets()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athanor.fr'

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>L'athanor — Billets</title>
    <link>${baseUrl}</link>
    <description>Articles de philosophie contemporaine</description>
    <language>fr</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${billets.slice(0, 20).map(b => `
    <item>
      <title>${escapeXml(b.title)}</title>
      <link>${baseUrl}/billets/${b.slug}</link>
      <pubDate>${new Date(b.date).toUTCString()}</pubDate>
      <description>${escapeXml(b.excerpt || '')}</description>
      <guid>${baseUrl}/billets/${b.slug}</guid>
    </item>`).join('')}
  </channel>
</rss>`

    return new Response(rss, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600',
        },
    })
}

function escapeXml(str: string) {
    return str.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c))
}
