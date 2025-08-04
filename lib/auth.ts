import { NextRequest } from 'next/server'

export function validateAdminAccess(request: NextRequest): boolean {
  const adminKey = request.headers.get('x-admin-key')
  const expectedKey = process.env.ADMIN_API_KEY
  
  if (!adminKey || !expectedKey) {
    return false
  }
  
  return adminKey === expectedKey
}

export function createUnauthorizedResponse() {
  return new Response(
    JSON.stringify({ 
      error: 'Accès non autorisé',
      message: 'Clé d\'administration requise' 
    }),
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}