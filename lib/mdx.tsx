import { MDXRemote } from 'next-mdx-remote/rsc'
import { MDXContent } from '@/components/MDXContent'

// Compilateur MDX côté serveur
export async function compileMDX(content: string) {
  return (
    <MDXContent>
      <MDXRemote source={content} />
    </MDXContent>
  )
}