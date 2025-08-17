export type LinkPreview = {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
  author?: string
}

function absoluteUrl(base: string, maybeUrl?: string) {
  if (!maybeUrl) return undefined
  try {
    return new URL(maybeUrl, base).toString()
  } catch {
    return undefined
  }
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AthanorBot/1.0; +https://example.com/bot)',
      },
      signal: controller.signal,
    } as RequestInit)

    const html = await res.text()
    const preview: LinkPreview = { url }

    const pick = (re: RegExp) => {
      const m = html.match(re)
      return m?.[1]?.trim()
    }

    // OpenGraph and Twitter fallbacks
    const ogTitle =
      pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    const docTitle = pick(/<title[^>]*>([^<]+)<\/title>/i)
    preview.title = ogTitle || docTitle

    const ogDesc =
      pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      pick(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    preview.description = ogDesc

    const ogImage =
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
      pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    preview.image = absoluteUrl(url, ogImage)

    const siteName = pick(
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["'][^>]*>/i
    )
    preview.siteName = siteName

    const author = pick(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["'][^>]*>/i)
    preview.author = author

    return preview
  } catch {
    return { url }
  } finally {
    clearTimeout(timeout)
  }
}
