import type { UserItem } from '@/hooks/use-users'

type UserRowProps = {
  user: UserItem
}

export function UserRow({ user }: UserRowProps) {
  return (
    <tr style={{ borderTop: '1px solid #e2e8f0' }}>
      <td style={{ padding: '12px 16px' }}>{user.name}</td>
      <td style={{ padding: '12px 16px', color: '#64748b' }}>{user.email}</td>
      <td style={{ padding: '12px 16px', color: '#64748b' }}>
        {user.createdAt ?? '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            background: '#dcfce7',
            color: '#16a34a',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Active
        </span>
      </td>
    </tr>
  )
}
