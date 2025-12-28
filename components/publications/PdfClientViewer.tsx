'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCw } from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Worker local pour éviter les problèmes CORS et de version
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

interface PdfClientViewerProps {
  pdfUrl: string
  title: string
  initialPage?: number
}

export function PdfClientViewer({ pdfUrl, title, initialPage = 1 }: PdfClientViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(initialPage)
  const [scale, setScale] = useState<number>(1.0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  // Observer pour la largeur du conteneur (responsive)
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Synchroniser avec initialPage
  useEffect(() => {
    setPageNumber(initialPage)
  }, [initialPage])

  // Gestion du plein écran natif
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          changePage(-1)
          break
        case 'ArrowRight':
          e.preventDefault()
          changePage(1)
          break
        case '+':
        case '=':
          e.preventDefault()
          changeScale(0.1)
          break
        case '-':
          e.preventDefault()
          changeScale(-0.1)
          break
        case 'Escape':
          if (isFullscreen) exitFullscreen()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [numPages, pageNumber, isFullscreen])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(err: Error) {
    console.error('PDF load error:', err)
    setError('Impossible de charger le document PDF.')
    setLoading(false)
  }

  const changePage = useCallback((offset: number) => {
    setPageNumber(prev => Math.min(Math.max(1, prev + offset), numPages || 1))
  }, [numPages])

  const changeScale = useCallback((delta: number) => {
    setScale(prev => Math.min(Math.max(0.5, prev + delta), 2.5))
  }, [])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page)
    }
  }

  const toggleFullscreen = async () => {
    if (!viewerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await viewerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    }
  }

  // Calculer la largeur optimale pour le PDF
  const pdfWidth = containerWidth > 0
    ? Math.min(containerWidth - 48, 800) * scale
    : undefined

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 mb-6 rounded-full bg-subtle/10 flex items-center justify-center">
          <RotateCw className="w-8 h-8 text-subtle" />
        </div>
        <h3 className="text-lg font-light text-foreground mb-2">Erreur de chargement</h3>
        <p className="text-sm text-subtle mb-6 max-w-md">{error}</p>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 bg-foreground text-background text-sm font-medium rounded-lg hover:bg-foreground/90 transition-colors"
        >
          Ouvrir le PDF directement
        </a>
      </div>
    )
  }

  return (
    <div
      ref={viewerRef}
      className={`
        rounded-xl overflow-hidden
        ${isFullscreen
          ? 'fixed inset-0 z-50 bg-background rounded-none'
          : 'border border-subtle/20 bg-background/50 backdrop-blur-sm'
        }
      `}
    >
      {/* Barre de contrôles */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-subtle/15 bg-background/80 backdrop-blur-md">
        {/* Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1 || loading}
            className="p-2 rounded-lg hover:bg-subtle/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Page précédente"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-subtle/5">
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={pageNumber}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-12 text-center text-sm font-medium bg-transparent border-none outline-none text-foreground"
              disabled={loading}
            />
            <span className="text-sm text-subtle">/</span>
            <span className="text-sm text-subtle">{numPages || '—'}</span>
          </div>

          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages || loading}
            className="p-2 rounded-lg hover:bg-subtle/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Page suivante"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Zoom et plein écran */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => changeScale(-0.1)}
            disabled={scale <= 0.5 || loading}
            className="p-2 rounded-lg hover:bg-subtle/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom arrière"
          >
            <ZoomOut className="w-4 h-4 text-foreground" />
          </button>

          <span className="text-xs font-medium text-subtle min-w-[45px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => changeScale(0.1)}
            disabled={scale >= 2.5 || loading}
            className="p-2 rounded-lg hover:bg-subtle/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Zoom avant"
          >
            <ZoomIn className="w-4 h-4 text-foreground" />
          </button>

          <div className="w-px h-5 bg-subtle/20 mx-2" />

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-subtle/10 transition-colors"
            aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen
              ? <Minimize2 className="w-4 h-4 text-foreground" />
              : <Maximize2 className="w-4 h-4 text-foreground" />
            }
          </button>
        </div>
      </div>

      {/* Zone d'affichage du PDF */}
      <div
        ref={containerRef}
        className={`
          overflow-auto bg-[#f8f6f0]
          ${isFullscreen ? 'h-[calc(100vh-56px)]' : 'h-[70vh] min-h-[400px]'}
        `}
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.02) 0%, transparent 100%)'
        }}
      >
        <div className="flex justify-center py-6 px-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-subtle">Chargement du document...</p>
            </div>
          )}

          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className={loading ? 'hidden' : 'block'}
          >
            <Page
              pageNumber={pageNumber}
              width={pdfWidth}
              className="shadow-xl rounded-sm overflow-hidden"
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div className="flex items-center justify-center h-[600px] w-[500px] bg-white rounded-sm shadow-xl">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              }
            />
          </Document>
        </div>
      </div>

      {/* Indicateur de page en bas (mobile-friendly) */}
      <div className="flex items-center justify-center py-2 border-t border-subtle/10 bg-background/60 backdrop-blur-sm md:hidden">
        <span className="text-xs text-subtle">
          Page {pageNumber} sur {numPages}
        </span>
      </div>
    </div>
  )
}
