'use client'

export function TriggerErrorButton() {
  return (
    <button
      className="btn btn-secondary"
      onClick={() => {
        // Intentionally throw to trigger a client error captured by Sentry
        throw new Error('Test Sentry: button click')
      }}
    >
      Provoquer une erreur JS
    </button>
  )
}
