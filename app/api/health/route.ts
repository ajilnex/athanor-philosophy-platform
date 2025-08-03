import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🩺 Health check endpoint called')
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Server is running'
    })
  } catch (error) {
    console.error('❌ Health check failed:', error)
    
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}