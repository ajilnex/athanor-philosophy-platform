'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string | null
  email: string
  role: 'VISITOR' | 'USER' | 'ADMIN'
  createdAt: Date
  emailVerified: Date | null
}

interface UserDashboardProps {
  users: User[]
}

export default function UserDashboard({ users }: UserDashboardProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticUsers, updateOptimisticUsers] = useOptimistic(
    users,
    (state, { userId, newRole }: { userId: string; newRole: 'USER' | 'ADMIN' }) => {
      return state.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
    }
  )
  const router = useRouter()

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    // Optimistic update
    updateOptimisticUsers({ userId, newRole })

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        })

        if (!response.ok) {
          throw new Error('Failed to update user role')
        }

        // Refresh the page to get the latest data
        router.refresh()
      } catch (error) {
        console.error('Error updating user role:', error)
        // Revert optimistic update on error
        router.refresh()
      }
    })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="bg-background border border-subtle/30 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-subtle/5 border-b border-subtle/30">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-subtle uppercase tracking-wider">
                Inscription
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/30">
            {optimisticUsers.map((user) => (
              <tr key={user.id} className="hover:bg-subtle/5">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-foreground">
                    {user.name || 'Nom non défini'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as 'USER' | 'ADMIN')}
                    disabled={isPending}
                    className="text-sm border border-subtle/30 rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.emailVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.emailVerified ? 'Vérifié' : 'Non vérifié'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {optimisticUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-subtle">Aucun utilisateur trouvé.</p>
        </div>
      )}
      
      <div className="px-6 py-3 bg-subtle/5 border-t border-subtle/30">
        <p className="text-sm text-subtle">
          Total : {optimisticUsers.length} utilisateur{optimisticUsers.length > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}