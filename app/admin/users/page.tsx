import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import UserDashboard from '@/components/admin/UserDashboard'

export const metadata = {
  title: "Gestion des utilisateurs - Admin - L'athanor",
  description: 'Interface de gestion des utilisateurs et des rôles',
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
          Gestion des utilisateurs
        </h1>
        <p className="text-subtle">Gérez les utilisateurs et leurs rôles d'accès.</p>
      </div>

      <UserDashboard users={users} />
    </div>
  )
}
