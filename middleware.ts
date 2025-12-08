import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
        const isEditorRoute = req.nextUrl.pathname.includes('/editer')

        // Protéger les routes admin
        if (isAdminRoute && token?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/auth/signin', req.url))
        }

        // Protéger les routes d'édition (USER ou ADMIN)
        if (isEditorRoute && !['USER', 'ADMIN'].includes(token?.role as string)) {
            return NextResponse.redirect(new URL('/auth/signin', req.url))
        }

        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/auth/signin',
        },
    }
)

export const config = {
    matcher: [
        '/admin/:path*',
        '/billets/:slug/editer',
        '/billets/nouveau',
    ],
}
