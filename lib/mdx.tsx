import { MDXRemote } from 'next-mdx-remote/rsc'
import { MDXContent } from '@/components/MDXContent'
import { remark } from 'remark'
import html from 'remark-html'

// Compilateur mixte MDX/MD côté serveur
export async function compileMDX(content: string, isMdx: boolean = true) {
  if (isMdx) {
    // Contenu MDX - compilation complète avec composants React
    return (
      <MDXContent>
        <MDXRemote source={content} />
      </MDXContent>
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