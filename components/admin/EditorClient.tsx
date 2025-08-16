'use client'

import React, { useState, useRef } from 'react'
import { Save, BookOpen, List, AlertCircle, CheckCircle, Link2 } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { InsertReferenceDialog } from './InsertReferenceDialog'
import { BacklinkPicker } from '@/components/editor/BacklinkPicker'
import { closeBrackets } from '@codemirror/autocomplete'
import { Prec } from '@codemirror/state'
import toast from 'react-hot-toast'

interface EditorClientProps {
  filePath: string
  initialContent: string
  slug: string
}

export function EditorClient({ filePath, initialContent, slug }: EditorClientProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  const [showReferenceDialog, setShowReferenceDialog] = useState(false)
  const [showBacklinkPicker, setShowBacklinkPicker] = useState(false)
  const [selectedTextForBacklink, setSelectedTextForBacklink] = useState('')
  const editorRef = useRef<any>(null)

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/billets/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: filePath,
          content,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.invalidKeys) {
          toast.error(`Citations invalides: ${result.invalidKeys.join(', ')}`, {
            duration: 5000,
          })
        } else {
          toast.error(result.error || 'Erreur lors de la sauvegarde')
        }
        return
      }

      toast.success(result.message)
      
      if (result.citationsCount > 0) {
        toast.success(`${result.citationsCount} citation(s) validée(s)`, {
          duration: 3000,
        })
      }

    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur de connexion')
    } finally {
      setIsSaving(false)
    }
  }

  const insertText = (text: string) => {
    if (editorRef.current?.view) {
      const view = editorRef.current.view
      const pos = view.state.selection.main.head
      
      view.dispatch({
        changes: { from: pos, insert: text },
        selection: { anchor: pos + text.length }
      })
      
      // Mettre à jour l'état local
      const newContent = view.state.doc.toString()
      setContent(newContent)
      
      // Remettre le focus sur l'éditeur
      view.focus()
    }
  }

  const handleInsertReference = (key: string) => {
    insertText(`<Cite item="${key}" />`)
  }

  const handleInsertBibliography = () => {
    // Vérifier si <Bibliography /> existe déjà
    if (content.includes('<Bibliography')) {
      toast.error('Une bibliographie est déjà présente dans le document')
      return
    }

    // Insérer à la fin du document
    const bibliographyText = '\n\n<Bibliography />'
    
    if (editorRef.current?.view) {
      const view = editorRef.current.view
      const docLength = view.state.doc.length
      
      view.dispatch({
        changes: { from: docLength, insert: bibliographyText },
        selection: { anchor: docLength + bibliographyText.length }
      })
      
      const newContent = view.state.doc.toString()
      setContent(newContent)
      view.focus()
    }
    
    toast.success('Bibliographie ajoutée en fin de document')
  }

  const handleBacklinkSelected = (slug: string, alias?: string) => {
    const backlinkText = alias ? `[[${slug}|${alias}]]` : `[[${slug}]]`
    
    // Insertion simple au curseur (déclencheur retiré)
    insertText(backlinkText)
    
    setShowBacklinkPicker(false)
  }

  const handleCreateNewBillet = async (title: string, alias?: string) => {
    // Générer le slug depuis le titre
    const today = new Date().toISOString().split('T')[0]
    const slugFromTitle = title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const slug = `${today}-${slugFromTitle}`
    
    try {
      // Créer le nouveau billet
      const response = await fetch('/api/admin/billets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          content: `# ${title}\n\nContenu à venir...`,
          tags: [],
          excerpt: ''
        })
      })
      
      if (response.ok) {
        toast.success(`Nouveau billet "${title}" créé`)
      }
    } catch (error) {
      console.error('Erreur création billet:', error)
      toast.error('Erreur lors de la création du billet')
    }
    
    // Insérer le backlink dans tous les cas
    const backlinkText = alias ? `[[${slug}|${alias}]]` : `[[${slug}]]`
    insertText(backlinkText)
    setShowBacklinkPicker(false)
  }

  // Déclencheur [[ retiré

  const handleBacklinkPickerClose = () => {
    setShowBacklinkPicker(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-subtle/20 bg-background/50">
        <div className="flex items-center space-x-1">
          <h2 className="text-lg font-serif font-light text-foreground">
            Éditeur : {slug}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowReferenceDialog(true)}
            className="inline-flex items-center px-3 py-2 text-sm bg-background border border-subtle/50 text-foreground rounded-md hover:bg-muted transition-colors"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Insérer une référence
          </button>
          
          <button
            onClick={handleInsertBibliography}
            className="inline-flex items-center px-3 py-2 text-sm bg-background border border-subtle/50 text-foreground rounded-md hover:bg-muted transition-colors"
          >
            <List className="h-4 w-4 mr-2" />
            Insérer Bibliography
          </button>
          
          <button
            onClick={() => {
              if (editorRef.current?.view) {
                const view = editorRef.current.view
                const sel = view.state.selection.main
                const txt = sel.empty ? '' : view.state.sliceDoc(sel.from, sel.to)
                setSelectedTextForBacklink(txt)
              } else {
                setSelectedTextForBacklink('')
              }
              setShowBacklinkPicker(true)
            }}
            className="inline-flex items-center px-3 py-2 text-sm bg-background border border-subtle/50 text-foreground rounded-md hover:bg-muted transition-colors"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Backlink
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 text-sm bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border border-white/30 border-t-white rounded-full"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <CodeMirror
          ref={editorRef}
          value={content}
          height="100%"
          basicSetup={{ closeBrackets: false }}
          extensions={[
            markdown(),
            EditorView.theme({
              '&': {
                height: '100%',
                fontSize: '14px',
              },
              '.cm-content': {
                padding: '20px',
                minHeight: '100%',
                fontFamily: '"IBM Plex Mono", "Monaco", "Consolas", monospace',
                lineHeight: '1.6',
              },
              '.cm-focused': {
                outline: 'none',
              },
              '.cm-editor': {
                height: '100%',
              },
              '.cm-scroller': {
                height: '100%',
              }
            }),
            // Désactiver l'auto‑complétion des crochets [] pour éviter les ]] ajoutés automatiquement
            // (basicSetup.closeBrackets est déjà désactivé au niveau du composant)
          ]}
          onChange={(value) => setContent(value)}
        />
      </div>

      {/* Status Bar */}
      <div className="p-3 border-t border-subtle/20 bg-background/50">
        <div className="flex items-center justify-between text-sm text-subtle">
          <div className="flex items-center space-x-4">
            <span>{content.length} caractères</span>
            <span>{content.split('\n').length} lignes</span>
            {content.includes('<Cite') && (
              <span className="flex items-center space-x-1 text-accent">
                <CheckCircle className="h-3 w-3" />
                <span>Citations détectées</span>
              </span>
            )}
          </div>
          
          <div className="text-xs">
            Fichier: {filePath}
          </div>
        </div>
      </div>

      {/* Insert Reference Dialog */}
      <InsertReferenceDialog
        isOpen={showReferenceDialog}
        onClose={() => setShowReferenceDialog(false)}
        onSelect={handleInsertReference}
      />

      {/* Backlink Picker */}
      <BacklinkPicker
        isOpen={showBacklinkPicker}
        onClose={handleBacklinkPickerClose}
        onSelect={handleBacklinkSelected}
        onCreateNew={handleCreateNewBillet}
        selectedText={selectedTextForBacklink}
      />
    </div>
  )
}
