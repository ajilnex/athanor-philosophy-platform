import { NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function GET() {
  try {
    console.log('🧪 Testing Cloudinary connection...')

    // Test connection by getting account details
    const result = await cloudinary.api.ping()

    console.log('✅ Cloudinary ping successful:', result)

    return NextResponse.json({
      success: true,
      message: 'Cloudinary connection successful!',
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'not set',
        api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'not set',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'not set',
        cloudinary_url: process.env.CLOUDINARY_URL ? 'set' : 'not set',
      },
      ping: result,
    })
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        config: {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'not set',
          api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'not set',
          api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'not set',
          cloudinary_url: process.env.CLOUDINARY_URL ? 'set' : 'not set',
        },
      },
      { status: 500 }
    )
  }
}
