'use client'

type DeployStatus = 'idle' | 'pushed' | 'deploying' | 'live' | 'failed'

type Props = {
  status: DeployStatus
  siteUrl: string | null
}

const STEPS: { key: DeployStatus; label: string }[] = [
  { key: 'pushed',    label: 'บันทึกการเปลี่ยนแปลง' },
  { key: 'deploying', label: 'กำลังอัพเดทเว็บ'       },
  { key: 'live',      label: 'เสร็จแล้ว'              },
]

function stepIndex(status: DeployStatus): number {
  const map: Record<DeployStatus, number> = {
    idle: -1, pushed: 0, deploying: 1, live: 2, failed: -1,
  }
  return map[status]
}

export function DeployResult({ status, siteUrl }: Props) {
  if (status === 'idle') return null

  const current = stepIndex(status)

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '16px 20px',
        background: status === 'live' ? '#f0fdf4' : '#f8fafc',
        border: `1px solid ${status === 'live' ? '#86efac' : status === 'failed' ? '#fca5a5' : '#e2e8f0'}`,
        borderRadius: '8px',
      }}
    >
      {/* Progress steps */}
      {status !== 'failed' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          {STEPS.map((step, i) => {
            const done = i < current
            const active = i === current
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Circle */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: done || active ? '#1e293b' : '#e2e8f0',
                  }}
                >
                  {done ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : active ? (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#fff',
                        animation: 'pulse 1s ease-in-out infinite',
                      }}
                    />
                  ) : (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }} />
                  )}
                </div>
                {/* Label */}
                <span
                  style={{
                    fontSize: '13px',
                    color: done || active ? '#0f172a' : '#94a3b8',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {step.label}
                </span>
                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div style={{ width: '24px', height: '1px', background: done ? '#1e293b' : '#e2e8f0' }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Live result */}
      {status === 'live' && siteUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#166534', margin: '0 0 2px' }}>
              เว็บของคุณอัพเดทแล้ว
            </p>
            <p style={{ fontSize: '13px', color: '#16a34a', margin: 0 }}>
              การเปลี่ยนแปลงที่คุณขอมีผลแล้วบนเว็บจริง
            </p>
          </div>
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: 'auto',
              padding: '8px 20px',
              background: '#166534',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            ดูเว็บ
          </a>
        </div>
      )}

      {/* Deploying message */}
      {status === 'deploying' && (
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          รอสักครู่ ระบบกำลังอัพเดทเว็บให้คุณ (ประมาณ 1-2 นาที)
        </p>
      )}

      {/* Pushed message */}
      {status === 'pushed' && (
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          บันทึกการเปลี่ยนแปลงแล้ว กำลังเริ่ม deploy...
        </p>
      )}

      {/* Failed */}
      {status === 'failed' && (
        <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>
          เกิดข้อผิดพลาดในการอัพเดทเว็บ กรุณาแจ้งทีมงาน
        </p>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
