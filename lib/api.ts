// Utilitaire pour faire des appels API sécurisés aux endpoints admin
export function createAuthenticatedRequest(url: string, options: RequestInit = {}): RequestInit {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || 'default-dev-key'
  
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
      ...options.headers,
    },
  }
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  return fetch(url, createAuthenticatedRequest(url, options))
}