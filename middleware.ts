import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const isAdmin = req.nextUrl.pathname.startsWith('/admin')
      if (isAdmin) return token?.role === 'admin'
      return true
    },
  },
})

export const config = {
  matcher: [
    '/admin/:path*',
    // '/api/admin/:path*', // décommente plus tard si besoin
  ],
}
