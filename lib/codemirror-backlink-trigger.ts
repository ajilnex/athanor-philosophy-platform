import { EditorView, ViewUpdate } from '@codemirror/view'
import { Extension } from '@codemirror/state'

/**
 * Extension CodeMirror 6 pour détecter la saisie `[[` et déclencher l'ouverture de la palette backlink
 */
export function backlinkTriggerExtension(onTrigger: (position: number) => void): Extension {
  console.log('🚀 Extension backlinkTrigger créée')
  
  const updateListener = EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    console.log('🔄 UpdateListener déclenché')
    if (!viewUpdate.docChanged) {
      return
    }
    
    console.log('📝 Document modifié, vérification des changements...')
    
    // Ignorer pendant composition IME pour éviter déclenchements prématurés
    if (viewUpdate.view.composing) {
      console.log('⌨️  Composition IME en cours, trigger ignoré')
      return
    }
    
    // Parcourir toutes les insertions de texte dans cette transaction
    viewUpdate.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
      const insertedText = inserted.toString()
      console.log('🔍 Texte inséré:', JSON.stringify(insertedText))
      
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
      } else if (insertedText === '[') {
        // Vérifier si on a maintenant [[ dans le document à cette position
        const doc = viewUpdate.state.doc
        const textBefore = doc.sliceString(Math.max(0, fromB - 1), fromB + 1)
        console.log('🔍 Caractère [ détecté, texte autour:', JSON.stringify(textBefore))
        
        if (textBefore === '[[') {
          console.log('🔥 Séquence [[ détectée après insertion individuelle')
          const absolutePosition = fromB + 1 // Position après les [[
          
          setTimeout(() => {
            console.log('🔥 Appel onTrigger (méthode alternative)')
            onTrigger(absolutePosition)
          }, 0)
        }
      }
    })
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