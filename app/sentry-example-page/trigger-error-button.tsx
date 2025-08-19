'use client'

import * as Sentry from '@sentry/nextjs'

export function TriggerErrorButton() {
  return (
    <button
      className="btn btn-secondary"
      onClick={() => {
        try {
          throw new Error('Test Sentry: button click')
        } catch (err) {
          Sentry.captureException(err)
        }
      }}
    >
      Provoquer une erreur JS
    </button>
  )
}
