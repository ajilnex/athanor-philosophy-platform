'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Log error to console (Sentry removed)
  console.error('Global error:', error)

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold">Une erreur est survenue</h2>
          <p className="text-subtle">Nous avons été notifiés et regardons ce qui s'est passé.</p>
          <button className="btn btn-secondary" onClick={() => reset()}>
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
