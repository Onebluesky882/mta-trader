'use client'
import { useUsers } from '@/hooks/use-users'
import { UserTable } from '@/components/users/user-table'

export default function UsersPage() {
  const { users, isLoading } = useUsers()

  if (isLoading) {
    return (
      <div>
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Users</h1>
        <p style={{ color: '#64748b' }}>Loading users...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>Users</h1>
      <UserTable users={users} />
    </div>
  )
}
