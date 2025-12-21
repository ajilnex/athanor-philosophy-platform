import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, BookOpen, Calendar, Users } from 'lucide-react'
import fs from 'fs'
import path from 'path'
import { BibTeXExport } from '@/components/bibliography/BibTeXExport'

interface BibliographyEntry {
  key: string
  type: string
  title: string
  authors: {
    family: string
    given: string
  }[]
  year: string
  container: string
  DOI: string
  URL: string
  ISBN: string
  tags: string[]
  volume?: string
  issue?: string
  pages?: string
  publisher?: string
  place?: string
}

interface CitationContext {
  slug: string
  title: string
  excerpt: string
}

interface CitationsMap {
  [key: string]: CitationContext[]
}

export async function generateStaticParams() {
  try {
    const bibliographyPath = path.join(process.cwd(), 'public', 'bibliography.json')

    if (!fs.existsSync(bibliographyPath)) {
      return []
    }

    const bibliography: BibliographyEntry[] = JSON.parse(fs.readFileSync(bibliographyPath, 'utf8'))

    return bibliography.map(entry => ({
      key: entry.key,
    }))
  } catch (error) {
    console.error('Erreur lors de la génération des paramètres statiques:', error)
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }) {
  try {
    const bibliographyPath = path.join(process.cwd(), 'public', 'bibliography.json')
    const bibliography: BibliographyEntry[] = JSON.parse(fs.readFileSync(bibliographyPath, 'utf8'))

    const { key } = await params
    const entry = bibliography.find(item => item.key === key)
    if (!entry) {
      return {
        title: 'Référence introuvable - Athanor',
      }
    }

    const authors =
      entry.authors.length > 0
        ? entry.authors.map(author => author.family).join(', ')
        : 'Auteur inconnu'

    const title = `${authors} (${entry.year || 's.d.'}) — ${entry.title}`

    return {
      title: `${title} - Athanor`,
      description: `Référence bibliographique: ${entry.title}. ${authors}, ${entry.year || 's.d.'}`,
    }
  } catch (error) {
    return {
      title: 'Référence - Athanor',
    }
  }
}

function formatAuthors(authors: BibliographyEntry['authors']): string {
  if (authors.length === 0) return 'Auteur inconnu'

  if (authors.length === 1) {
    const author = authors[0]
    return `${author.family}, ${author.given}`
  }

  if (authors.length === 2) {
    return `${authors[0].family}, ${authors[0].given} et ${authors[1].family}, ${authors[1].given}`
  }

  // Plus de 2 auteurs: premiers auteurs + "et al."
  return `${authors[0].family}, ${authors[0].given} et al.`
}

function formatFullCitation(entry: BibliographyEntry): string {
  const authors = formatAuthors(entry.authors)
  let citation = `${authors}. ${entry.title}.`

  if (entry.container) {
    citation += ` ${entry.container}`

    if (entry.volume) citation += `, vol. ${entry.volume}`
    if (entry.issue) citation += `, no ${entry.issue}`
    if (entry.pages) citation += `, p. ${entry.pages}`
  }

  if (entry.publisher) {
    citation += ` ${entry.publisher}`
  }

  if (entry.place) {
    citation += `, ${entry.place}`
  }

  if (entry.year) {
    citation += `, ${entry.year}`
  }

  citation += '.'

  return citation
}

export default async function RefPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  let entry: BibliographyEntry | null = null
  let citedIn: CitationContext[] = []

  try {
    // Charger la bibliographie
    const bibliographyPath = path.join(process.cwd(), 'public', 'bibliography.json')
    const bibliography: BibliographyEntry[] = JSON.parse(fs.readFileSync(bibliographyPath, 'utf8'))

    entry = bibliography.find(item => item.key === key) || null

    // Charger la carte des citations
    const citationsMapPath = path.join(process.cwd(), 'public', 'citations-map.json')
    if (fs.existsSync(citationsMapPath)) {
      const citationsMap: CitationsMap = JSON.parse(fs.readFileSync(citationsMapPath, 'utf8'))
      citedIn = citationsMap[key] || []
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  }

  if (!entry) {
    notFound()
  }

  const fullCitation = formatFullCitation(entry)
  const shortAuthors = entry.authors.length > 0 ? entry.authors[0].family : 'Auteur inconnu'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Navigation */}
      <div className="mb-8">
        <Link
          href="/billets/bibliographie-collective"
          className="inline-flex items-center text-subtle hover:text-foreground mb-6 font-light"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la bibliographie
        </Link>

        {/* En-tête de la référence */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-light text-foreground font-serif">
              {entry.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-subtle mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{formatAuthors(entry.authors)}</span>
            </div>

            {entry.year && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{entry.year}</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span className="capitalize">{entry.type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Détails de la référence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Citation complète */}
          <section>
            <h2 className="text-lg font-serif font-light text-foreground mb-3">Citation</h2>
            <div className="bg-background/50 rounded-lg border border-subtle/20 p-4">
              <p className="text-foreground leading-relaxed text-sm">{fullCitation}</p>
            </div>
          </section>

          {/* Informations détaillées */}
          <section>
            <h2 className="text-lg font-serif font-light text-foreground mb-3">Détails</h2>
            <div className="space-y-3 text-sm">
              {entry.container && (
                <div>
                  <span className="font-medium text-foreground">Publication : </span>
                  <span className="text-subtle">{entry.container}</span>
                </div>
              )}

              {entry.publisher && (
                <div>
                  <span className="font-medium text-foreground">Éditeur : </span>
                  <span className="text-subtle">{entry.publisher}</span>
                </div>
              )}

              {entry.place && (
                <div>
                  <span className="font-medium text-foreground">Lieu : </span>
                  <span className="text-subtle">{entry.place}</span>
                </div>
              )}

              {(entry.volume || entry.issue || entry.pages) && (
                <div>
                  <span className="font-medium text-foreground">Référence : </span>
                  <span className="text-subtle">
                    {entry.volume && `vol. ${entry.volume}`}
                    {entry.issue && `, no ${entry.issue}`}
                    {entry.pages && `, p. ${entry.pages}`}
                  </span>
                </div>
              )}

              {entry.ISBN && (
                <div>
                  <span className="font-medium text-foreground">ISBN : </span>
                  <span className="text-subtle font-mono">{entry.ISBN}</span>
                </div>
              )}

              <div>
                <span className="font-medium text-foreground">Clé de citation : </span>
                <code className="text-subtle bg-muted px-2 py-1 rounded text-xs font-mono">
                  {entry.key}
                </code>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Liens externes */}
          <section>
            <h3 className="text-base font-serif font-light text-foreground mb-3">Accès</h3>
            <div className="space-y-2">
              {entry.DOI ? (
                <a
                  href={`https://doi.org/${entry.DOI}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-accent hover:text-accent/70 text-sm"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  DOI: {entry.DOI}
                </a>
              ) : entry.URL ? (
                <a
                  href={entry.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-accent hover:text-accent/70 text-sm"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Lien externe
                </a>
              ) : (
                <span className="text-subtle text-sm">DOI indisponible</span>
              )}
            </div>
          </section>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <section>
              <h3 className="text-base font-serif font-light text-foreground mb-3">Mots-clés</h3>
              <div className="flex flex-wrap gap-1">
                {entry.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 text-xs bg-muted text-foreground rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Export BibTeX */}
          <section>
            <h3 className="text-base font-serif font-light text-foreground mb-3">Exporter</h3>
            <BibTeXExport entry={entry} />
          </section>
        </div>
      </div>

      {/* Section "Cité dans" */}
      {citedIn.length > 0 && (
        <section className="mt-12 pt-8 border-t border-subtle/20">
          <h2 className="text-xl font-serif font-light text-foreground mb-6">
            Cité dans ({citedIn.length})
          </h2>

          <div className="space-y-4">
            {citedIn.map(citation => (
              <div
                key={citation.slug}
                className="bg-background/50 rounded-lg border border-subtle/20 p-4 hover:border-subtle/40 transition-colors"
              >
                <h3 className="font-medium text-foreground mb-2">
                  <Link
                    href={`/billets/${citation.slug}`}
                    className="hover:text-accent transition-colors"
                  >
                    {citation.title}
                  </Link>
                </h3>
                <p className="text-subtle text-sm leading-relaxed">{citation.excerpt}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
