import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)

  return NextResponse.json({
    session,
    timestamp: new Date().toISOString(),
    debug: {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role,
      userId: (session?.user as any)?.id,
    },
  })
}
