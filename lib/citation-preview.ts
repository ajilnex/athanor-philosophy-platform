/**
 * Utility to format a citation key as "Author, Year" for preview
 * Uses fetch to load bibliography.json on the client
 */

interface BibEntry {
    key: string
    authors: { family: string; given: string }[]
    year: string
}

let cachedBibliography: BibEntry[] | null = null

export async function loadBibliographyForPreview(): Promise<BibEntry[]> {
    if (cachedBibliography) return cachedBibliography

    try {
        const response = await fetch('/bibliography.json')
        if (!response.ok) return []
        cachedBibliography = await response.json()
        return cachedBibliography || []
    } catch {
        return []
    }
}

export function formatCitationPreview(bibliography: BibEntry[], key: string): string {
    const entry = bibliography.find(e => e.key === key)
    if (!entry) return `[?${key}]`

    const author = entry.authors?.[0]?.family || 'Auteur inconnu'
    const year = entry.year || 's.d.'

    return `[${author}, ${year}]`
}

/**
 * Transform all <Cite item="..." /> tags in content to readable format
 */
export async function transformCitationsForPreview(content: string): Promise<string> {
    const bibliography = await loadBibliographyForPreview()

    return content.replace(
        /<Cite\s+[^>]*item=["']([^"']+)["'][^>]*\/?>(?: <\/Cite>)?/gi,
        (_match, key) => formatCitationPreview(bibliography, key)
    )
}
