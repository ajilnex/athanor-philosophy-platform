import { EditorView, ViewUpdate } from '@codemirror/view'
import { Extension } from '@codemirror/state'

/**
 * Extension CodeMirror 6 pour détecter la saisie `[[` et déclencher l'ouverture de la palette backlink
 */
export function backlinkTriggerExtension(onTrigger: (position: number) => void): Extension {
  const updateListener = EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (!viewUpdate.docChanged) return
    // Ignorer pendant composition IME pour éviter déclenchements prématurés
    if (viewUpdate.view.composing) return

    const pos = viewUpdate.state.selection.main.head
    if (pos >= 2) {
      const textBefore = viewUpdate.state.doc.sliceString(pos - 2, pos)
      if (textBefore === '[[') {
        // Ouvrir la palette après la transaction courante
        setTimeout(() => onTrigger(pos), 0)
      }
    }
  })
  return updateListener
}

/**
 * Extension pour nettoyer les `[[` orphelins quand la palette se ferme sans sélection
 */
export function cleanupBacklinkTrigger(view: EditorView, triggerPosition: number): void {
  const doc = view.state.doc
  const triggerStart = triggerPosition - 2 // Position des `[[`
  
  if (triggerStart >= 0) {
    const hasOpen = doc.sliceString(triggerStart, triggerPosition) === '[['
    const hasClose = doc.sliceString(triggerPosition, triggerPosition + 2) === ']]'
    if (hasOpen && hasClose) {
      // Supprimer le pattern complet `[[]]`
      view.dispatch({
        changes: { from: triggerStart, to: triggerPosition + 2, insert: '' },
        selection: { anchor: triggerStart }
      })
    } else if (hasOpen) {
      // Supprimer uniquement les `[[`
      view.dispatch({
        changes: { from: triggerStart, to: triggerPosition, insert: '' },
        selection: { anchor: triggerStart }
      })
    }
  }
}
