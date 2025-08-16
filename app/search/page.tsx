import { Suspense } from 'react'
import { UnifiedSearchClient } from '@/components/UnifiedSearchClient'

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <UnifiedSearchClient />
    </Suspense>
  )
}

function SearchPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
      <div className="h-10 bg-muted rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-muted rounded w-3/4 mb-12"></div>
      <div className="h-16 bg-muted rounded-lg w-full"></div>
    </div>
  )
}
