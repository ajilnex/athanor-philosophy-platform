import React from 'react'
import { TriggerErrorButton } from './trigger-error-button'

export default function SentryExamplePage() {
  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sentry – Page de test</h1>
      <p className="text-subtle">
        Cliquez sur le bouton ci-dessous pour générer une erreur volontaire et vérifier que Sentry
        la reçoit.
      </p>
      <TriggerErrorButton />
      <p className="text-sm text-subtle">
        Astuce: vous pouvez aussi ouvrir la console du navigateur et exécuter
        {" `setTimeout(() => { throw new Error('Test Sentry: manuel') }, 0)`"}.
      </p>
    </div>
  )
}
