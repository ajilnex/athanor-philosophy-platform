import { NextResponse } from 'next/server'
import { buildGraphData, GraphData } from '@/lib/graph/data-builder'

// Simple in-memory cache
let cachedData: GraphData | null = null
let lastCacheTime = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

export async function GET() {
  try {
    const now = Date.now()

    // Return cached data if valid
    if (cachedData && now - lastCacheTime < CACHE_TTL) {
      return NextResponse.json(cachedData)
    }

    console.log('🔄 Rebuilding graph data...')
    const data = await buildGraphData()

    // Update cache
    cachedData = data
    lastCacheTime = now

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error serving graph data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
