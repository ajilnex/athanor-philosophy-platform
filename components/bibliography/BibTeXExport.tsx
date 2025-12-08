'use client'

import { useState } from 'react'
import { Download, Check, Copy } from 'lucide-react'

interface BibTeXExportProps {
    entry: {
        key: string
        type: string
        title: string
        authors: { family: string; given: string }[]
        year: string
        container?: string
        DOI?: string
        URL?: string
        ISBN?: string
        volume?: string
        issue?: string
        pages?: string
        publisher?: string
        place?: string
    }
}

// Map our types to BibTeX types
const typeToBibTeX: Record<string, string> = {
    'article-journal': 'article',
    'journalArticle': 'article',
    book: 'book',
    bookSection: 'incollection',
    chapter: 'incollection',
    'paper-conference': 'inproceedings',
    thesis: 'phdthesis',
    webpage: 'misc',
}

export function BibTeXExport({ entry }: BibTeXExportProps) {
    const [copied, setCopied] = useState(false)

    const generateBibTeX = () => {
        const bibType = typeToBibTeX[entry.type] || 'misc'

        // Format authors for BibTeX
        const authors = entry.authors.length > 0
            ? entry.authors.map(a => `${a.family}, ${a.given}`).join(' and ')
            : 'Anonymous'

        // Build BibTeX entry
        const lines = [
            `@${bibType}{${entry.key},`,
            `  author = {${authors}},`,
            `  title = {${entry.title}},`,
            entry.year ? `  year = {${entry.year}},` : null,
            entry.container ? `  journal = {${entry.container}},` : null,
            entry.volume ? `  volume = {${entry.volume}},` : null,
            entry.issue ? `  number = {${entry.issue}},` : null,
            entry.pages ? `  pages = {${entry.pages}},` : null,
            entry.publisher ? `  publisher = {${entry.publisher}},` : null,
            entry.place ? `  address = {${entry.place}},` : null,
            entry.DOI ? `  doi = {${entry.DOI}},` : null,
            entry.URL ? `  url = {${entry.URL}},` : null,
            entry.ISBN ? `  isbn = {${entry.ISBN}},` : null,
            `}`,
        ].filter(Boolean)

        return lines.join('\n')
    }

    const handleCopy = async () => {
        const bibtex = generateBibTeX()
        await navigator.clipboard.writeText(bibtex)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        const bibtex = generateBibTeX()
        const blob = new Blob([bibtex], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${entry.key}.bib`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-subtle/30 rounded-lg hover:bg-subtle/10 transition-colors"
            >
                {copied ? (
                    <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Copié !</span>
                    </>
                ) : (
                    <>
                        <Copy className="h-4 w-4" />
                        <span>Copier BibTeX</span>
                    </>
                )}
            </button>

            <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
                <Download className="h-4 w-4" />
                <span>Télécharger .bib</span>
            </button>
        </div>
    )
}
