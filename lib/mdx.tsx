import { remark } from 'remark'
import html from 'remark-html'

// Compilateur simple MD côté serveur (sans MDX pour éviter les conflits React)
export async function compileMDX(content: string, isMdx: boolean = true) {
  // Pour l'instant, traiter tout comme du Markdown simple pour éviter les conflits React
  const processed = await remark().use(html, { sanitize: false }).process(content)
  return (
    <div 
      className="prose prose-sm sm:prose max-w-none"
      dangerouslySetInnerHTML={{ __html: processed.toString() }}
    />
  )
}