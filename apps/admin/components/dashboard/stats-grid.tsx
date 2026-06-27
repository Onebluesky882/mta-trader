import { StatCard } from './stat-card'

type StatItem = {
  label: string
  value: string
  status?: 'ok' | 'error'
}

type StatsGridProps = {
  stats: StatItem[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
      }}
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} status={stat.status} />
      ))}
    </div>
  )
}
