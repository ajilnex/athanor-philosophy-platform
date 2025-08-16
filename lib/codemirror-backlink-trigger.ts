import { EditorView, ViewUpdate } from '@codemirror/view'
import { Extension } from '@codemirror/state'

/**
 * Extension CodeMirror 6 pour détecter la saisie `[[` et déclencher l'ouverture de la palette backlink
 */
export function backlinkTriggerExtension(onTrigger: (position: number) => void): Extension {
  return EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (!viewUpdate.docChanged) return
    
    // Ignorer pendant composition IME pour éviter déclenchements prématurés
    if (viewUpdate.view.composing) return
    
    // Parcourir toutes les insertions de texte dans cette transaction
    viewUpdate.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
      const insertedText = inserted.toString()
      
      // Vérifier si l'insertion contient `[[`
      const bracketIndex = insertedText.indexOf('[[')
      if (bracketIndex !== -1) {
        console.log('🔥 Déclencheur [[ détecté:', { insertedText, bracketIndex })
        // Position dans le document où `[[` a été inséré
        const absolutePosition = fromB + bracketIndex + 2 // +2 pour être après les `[[`
        console.log('🔥 Position trigger:', absolutePosition)
        
        // Déclencher l'ouverture de la palette
        // Utiliser setTimeout pour éviter les conflits avec la transaction en cours
        setTimeout(() => {
          console.log('🔥 Appel onTrigger')
          onTrigger(absolutePosition)
        }, 0)
      }
    })
  })
}

/**
 * Extension pour nettoyer les `[[` orphelins quand la palette se ferme sans sélection
 */
export function cleanupBacklinkTrigger(view: EditorView, triggerPosition: number): void {
  const doc = view.state.doc
  const triggerStart = triggerPosition - 2 // Position des `[[`
  
  if (triggerStart >= 0) {
    const textBefore = doc.sliceString(Math.max(0, triggerStart - 10), triggerPosition)
    
    // Vérifier qu'on a bien des `[[` à nettoyer
    if (textBefore.endsWith('[[')) {
      view.dispatch({
        changes: {
          from: triggerStart,
          to: triggerPosition,
          insert: ''
        },
        selection: { anchor: triggerStart }
      })
    }
  }
}