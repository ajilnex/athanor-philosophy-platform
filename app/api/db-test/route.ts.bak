import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')
    
    // Test table existence
    const tableCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'Article'`
    console.log('📊 Article table check:', tableCount)
    
    // Test article count
    const articleCount = await prisma.article.count()
    console.log('📄 Article count:', articleCount)
    
    await prisma.$disconnect()
    
    return NextResponse.json({
      status: 'success',
      connection: 'ok',
      tableExists: true,
      articleCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Database test failed:', error)
    
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown database error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}