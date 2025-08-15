'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationData {
  page: number
  limit: number
  total: number
  pages: number
}

interface CommentPaginationProps {
  pagination: PaginationData
  onPageChange: (page: number) => void
  loading: boolean
}

export function CommentPagination({ pagination, onPageChange, loading }: CommentPaginationProps) {
  const { page, pages, total } = pagination

  if (pages <= 1) return null

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const delta = 2 // Nombre de pages à afficher de chaque côté de la page actuelle
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages)
    } else if (pages > 1) {
      rangeWithDots.push(pages)
    }

    return rangeWithDots
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-subtle/20">
      {/* Info pagination */}
      <p className="text-sm text-subtle">
        Page {page} sur {pages} • {total} commentaire{total > 1 ? 's' : ''} au total
      </p>

      {/* Navigation */}
      <nav className="flex items-center gap-1" aria-label="Pagination des commentaires">
        {/* Bouton précédent */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="flex items-center gap-1 px-3 py-2 text-sm text-subtle
                   hover:text-foreground hover:bg-muted rounded-lg transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
        </button>

        {/* Numéros de page */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span 
                  key={`dots-${index}`}
                  className="px-3 py-2 text-subtle"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              )
            }

            const isCurrentPage = pageNum === page
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                disabled={loading}
                className={`
                  px-3 py-2 text-sm rounded-lg transition-colors
                  ${isCurrentPage 
                    ? 'bg-accent text-white' 
                    : 'text-subtle hover:text-foreground hover:bg-muted'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label={`Aller à la page ${pageNum}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Bouton suivant */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages || loading}
          className="flex items-center gap-1 px-3 py-2 text-sm text-subtle
                   hover:text-foreground hover:bg-muted rounded-lg transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Page suivante"
        >
          <span className="hidden sm:inline">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>

      {/* Saut de page rapide pour les grandes collections */}
      {pages > 10 && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="page-jump" className="text-subtle">
            Aller à la page :
          </label>
          <input
            id="page-jump"
            type="number"
            min="1"
            max={pages}
            defaultValue={page}
            disabled={loading}
            className="w-16 px-2 py-1 text-center border border-subtle/30 rounded
                     focus:outline-none focus:ring-2 focus:ring-accent/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLInputElement
                const newPage = parseInt(target.value)
                if (newPage >= 1 && newPage <= pages && newPage !== page) {
                  onPageChange(newPage)
                }
              }
            }}
          />
          <span className="text-subtle">/ {pages}</span>
        </div>
      )}

      {/* Indicateur de chargement */}
      {loading && (
        <div className="flex items-center gap-2 text-subtle">
          <div className="w-4 h-4 border-2 border-subtle border-t-accent rounded-full animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      )}
    </div>
  )
}