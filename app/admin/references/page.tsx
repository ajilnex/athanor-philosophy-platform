import fs from 'fs/promises'
import path from 'path'

type CitationRef = {
  slug: string
  title: string
  excerpt?: string
}

type CitationMap = Record<string, CitationRef[]>

type BiblioEntry = {
  key: string
  title: string
  authors?: { family: string; given: string }[]
  year?: string
  DOI?: string
  URL?: string
  container?: string
}

async function loadJson<T>(relativePath: string): Promise<T | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', relativePath)
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function formatAuthors(authors?: { family: string; given: string }[]) {
  if (!authors || authors.length === 0) return 'Auteur inconnu'
  if (authors.length === 1) return `${authors[0].family}, ${authors[0].given}`
  if (authors.length === 2) return `${authors[0].family} & ${authors[1].family}`
  return `${authors[0].family} et al.`
}

export default async function AdminReferencesPage() {
  const citationMap = (await loadJson<CitationMap>('citations-map.json')) || {}
  const bibliography = (await loadJson<BiblioEntry[]>('bibliography.json')) || []

  const biblioByKey = new Map(bibliography.map(e => [e.key, e]))

  const rows = Object.entries(citationMap)
    .map(([key, refs]) => {
      const entry = biblioByKey.get(key)
      return {
        key,
        count: refs.length,
        title: entry?.title || '(titre indisponible)',
        authors: formatAuthors(entry?.authors),
        year: entry?.year || '',
        container: entry?.container || '',
        samples: refs.slice(0, 3),
      }
    })
    .sort((a, b) => b.count - a.count)

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-serif font-light text-foreground mb-6">
        Références les plus citées
      </h1>

      <p className="text-subtle mb-6">
        Basé sur <code>public/citations-map.json</code>. Chaque ligne agrège les billets qui citent
        une même référence.
      </p>

      <div className="overflow-x-auto rounded-lg border border-subtle/20">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Clé</th>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Auteur(s)</th>
              <th className="px-4 py-3">Année</th>
              <th className="px-4 py-3">Cité par</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-t border-subtle/10">
                <td className="px-4 py-3 font-mono text-xs text-subtle">{row.key}</td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{row.title}</div>
                  {row.container && <div className="text-xs text-subtle">{row.container}</div>}
                </td>
                <td className="px-4 py-3 text-subtle">{row.authors}</td>
                <td className="px-4 py-3 text-subtle">{row.year}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-foreground">
                    <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs">
                      {row.count}
                    </span>
                    <span className="text-subtle">billet(s)</span>
                  </span>
                  <div className="mt-2 text-xs text-subtle space-x-2 truncate">
                    {row.samples.map(s => (
                      <a
                        key={s.slug}
                        className="underline hover:text-foreground"
                        href={`/billets/${s.slug}`}
                      >
                        {s.title}
                      </a>
                    ))}
                    {row.count > row.samples.length && <span>…</span>}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-subtle" colSpan={5}>
                  Aucune citation recensée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
