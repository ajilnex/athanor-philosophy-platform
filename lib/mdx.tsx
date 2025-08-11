import { MDXRemote } from 'next-mdx-remote/rsc'
import { remark } from 'remark'
import html from 'remark-html'
import { ImageUpload } from '@/components/billets/ImageUpload'

// Composants disponibles dans MDX
const mdxComponents = {
  // Headings
  h1: (props: any) => <h1 className="text-3xl font-light text-foreground mb-6 font-serif" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-light text-foreground mb-4 mt-8 font-serif" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-light text-foreground mb-3 mt-6 font-serif" {...props} />,
  
  // Paragraphs and text
  p: (props: any) => <p className="mb-4 text-foreground leading-relaxed" {...props} />,
  
  // Links - Gestion spéciale pour les backlinks
  a: (props: any) => {
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
  ul: (props: any) => <ul className="mb-4 space-y-1" {...props} />,
  ol: (props: any) => <ol className="mb-4 space-y-1" {...props} />,
  li: (props: any) => <li className="ml-6 text-foreground" {...props} />,
  
  // Code
  code: (props: any) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props} />,
  pre: (props: any) => <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto mb-4" {...props} />,
  
  // Blockquotes
  blockquote: (props: any) => <blockquote className="border-l-4 border-gray-200 pl-4 my-4 italic text-subtle" {...props} />,
  
  // Composants personnalisés Athanor
  ImageUpload: (props: any) => <ImageUpload className="my-6" {...props} />,
}

// Compilateur mixte MDX/MD côté serveur
export async function compileMDX(content: string, isMdx: boolean = true) {
  if (isMdx) {
    // Contenu MDX - compilation complète avec composants React
    return (
      <div className="prose prose-sm sm:prose max-w-none">
        <MDXRemote source={content} components={mdxComponents} />
      </div>
    )
  } else {
    // Contenu MD simple - traitement via remark
    const processed = await remark().use(html, { sanitize: false }).process(content)
    return (
      <div 
        className="prose prose-sm sm:prose max-w-none"
        dangerouslySetInnerHTML={{ __html: processed.toString() }}
      />
    )
  }
}