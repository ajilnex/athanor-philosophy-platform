'use client'

import dynamic from 'next/dynamic'

const PdfClientViewer = dynamic(
  () => import('@/components/publications/PdfClientViewer').then(mod => mod.PdfClientViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mx-auto mb-4"></div>
          <p className="text-subtle">Chargement du lecteur PDF...</p>
        </div>
      </div>
    ),
  }
)

interface PublicationViewerProps {
  pdfUrl: string
  title: string
  initialPage?: number
}

export function PublicationViewer({ pdfUrl, title, initialPage = 1 }: PublicationViewerProps) {
  return <PdfClientViewer pdfUrl={pdfUrl} title={title} initialPage={initialPage} />
}
