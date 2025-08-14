import type { MDXComponents } from 'mdx/types'
import { BibliographyProvider } from '@/components/bibliography/BibliographyProvider'
import { Cite } from '@/components/bibliography/Cite'
import { Bibliography } from '@/components/bibliography/Bibliography'
import { BibliographyIndex } from '@/components/bibliography/BibliographyIndex'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings - Style académique
    h1: (props) => <h1 className="text-3xl font-light text-foreground mb-6 font-serif" {...props} />,
    h2: (props) => <h2 className="text-2xl font-light text-foreground mb-4 mt-8 font-serif" {...props} />,
    h3: (props) => <h3 className="text-xl font-light text-foreground mb-3 mt-6 font-serif" {...props} />,
    
    // Paragraphs and text
    p: (props) => <p className="mb-4 text-foreground leading-relaxed" {...props} />,
    
    // Links - Gestion spéciale pour les backlinks
    a: (props) => {
      const isBacklink = props.className?.includes('backlink')
      const isMissing = props['data-missing'] === 'true'
      
      if (isBacklink) {
        return (
          <a 
            {...props}
            className={`backlink ${isMissing ? 'text-red-600 border-b border-red-300 border-dashed' : 'text-foreground bg-gray-100 px-1 rounded hover:bg-gray-200'} transition-colors`}
          />
        )
      }
      
      return <a className="text-foreground underline hover:text-foreground/70 transition-colors" {...props} />
    },
    
    // Lists
    ul: (props) => <ul className="mb-4 space-y-1" {...props} />,
    ol: (props) => <ol className="mb-4 space-y-1" {...props} />,
    li: (props) => <li className="ml-6 text-foreground" {...props} />,
    
    // Code
    code: (props) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
    pre: (props) => <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
    
    // Blockquotes
    blockquote: (props) => <blockquote className="border-l-4 border-gray-200 pl-4 my-4 italic text-subtle" {...props} />,
    
    // Composants personnalisés Athanor - Composants de citation et bibliographie
    Cite,
    Bibliography,
    BibliographyIndex,
    
    // Provider wrapper pour toute la page MDX avec système de citations
    wrapper: ({ children }) => (
      <BibliographyProvider>
        <div className="prose prose-sm sm:prose max-w-none">
          {children}
        </div>
      </BibliographyProvider>
    ),
    
    ...components,
  }
}