'use client'

import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface PdfClientViewerProps {
  pdfUrl: string
  title: string
  initialPage?: number
}

export function PdfClientViewer({ pdfUrl, title, initialPage = 1 }: PdfClientViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(initialPage)
  const [scale, setScale] = useState<number>(1.2)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  // Synchronize with initialPage changes
  useEffect(() => {
    setPageNumber(initialPage)
  }, [initialPage])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }

  function onDocumentLoadError(error: Error) {
    setError('Erreur lors du chargement du PDF')
    setLoading(false)
    console.error('PDF load error:', error)
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset
      return Math.min(Math.max(1, newPageNumber), numPages)
    })
  }

  function changeScale(delta: number) {
    setScale(prevScale => {
      const newScale = prevScale + delta
      return Math.min(Math.max(0.5, newScale), 3.0)
    })
  }

  function toggleFullscreen() {
    setIsFullscreen(!isFullscreen)
  }

  function downloadPdf() {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `${title}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-subtle bg-background/50 rounded-lg border border-subtle/20">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-subtle"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Erreur de chargement</h3>
          <p className="text-sm text-subtle">{error}</p>
          <button
            onClick={downloadPdf}
            className="mt-4 px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors text-sm"
          >
            Télécharger le PDF
          </button>
        </div>
      </div>
    )
  }

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-background'
    : 'rounded-lg border border-subtle/20 bg-background shadow-sm'

  return (
    <div className={containerClasses}>
      {/* Controls */}
      <div className="flex items-center justify-between bg-background/80 backdrop-blur-sm p-4 border-b border-subtle/20">
        <div className="flex items-center space-x-4">
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1 || loading}
              className="p-2 rounded-lg bg-background border border-subtle/30 hover:bg-subtle/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium min-w-[120px] text-center text-foreground">
              {loading ? (
                <span className="text-subtle">Chargement...</span>
              ) : (
                <>
                  Page <span className="font-semibold">{pageNumber}</span> sur{' '}
                  <span className="font-semibold">{numPages}</span>
                </>
              )}
            </div>
            <button
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages || loading}
              className="p-2 rounded-lg bg-background border border-subtle/30 hover:bg-subtle/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom */}
          <button
            onClick={() => changeScale(-0.2)}
            disabled={scale <= 0.5 || loading}
            className="p-2 rounded-lg bg-background border border-subtle/30 hover:bg-subtle/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom arrière"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium min-w-[60px] text-center text-foreground">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => changeScale(0.2)}
            disabled={scale >= 3.0 || loading}
            className="p-2 rounded-lg bg-background border border-subtle/30 hover:bg-subtle/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Zoom avant"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Actions */}
          <div className="border-l border-subtle/30 pl-2 ml-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-background border border-subtle/30 hover:bg-subtle/10 transition-colors"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={downloadPdf}
              className="p-2 rounded-lg bg-background border border-subtle/30 hover:bg-subtle/10 transition-colors ml-2"
              title="Télécharger le PDF"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Document */}
      <div
        className={`flex-1 overflow-auto bg-subtle/5 p-4 ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[70vh]'}`}
      >
        <div className="flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mx-auto mb-4"></div>
                  <p className="text-subtle">Chargement du PDF...</p>
                </div>
              </div>
            }
            className="max-w-none"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-lg border border-subtle/20 rounded-lg overflow-hidden"
              loading={
                <div className="flex items-center justify-center h-96 bg-background border border-subtle/20 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
                </div>
              }
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>

      {/* Fullscreen overlay background */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-background z-40" onClick={toggleFullscreen} />
      )}
    </div>
  )
}
