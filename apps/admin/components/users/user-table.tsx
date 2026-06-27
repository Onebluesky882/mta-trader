import type { UserItem } from '@/hooks/use-users'
import { UserRow } from './user-row'

type UserTableProps = {
  users: UserItem[]
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return <p style={{ color: '#64748b', marginTop: '16px' }}>No users found.</p>
  }

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: '#ffffff',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      <thead>
        <tr style={{ background: '#f1f5f9' }}>
          {['Name', 'Email', 'Created At', 'Status'].map((col) => (
            <th
              key={col}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '13px',
                color: '#64748b',
                fontWeight: 600,
              }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </tbody>
    </table>
  )
}
