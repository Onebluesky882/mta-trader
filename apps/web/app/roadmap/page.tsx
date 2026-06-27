import { readFileSync } from 'fs'
import { join } from 'path'
import { RoadmapClient } from './roadmap-client'
import { Navbar } from '@/components/navbar'
import { BackButton } from '@/components/back-button'

export const metadata = {
  title: 'Roadmap — Project Plan',
}

type Milestone = { id: string; name: string; goal: string; status: string }

function parseRoadmap(md: string) {
  // Matches both ## and # headings
  const section = (heading: string): string => {
    const re = new RegExp(`#{1,3} ${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n#{1,3} |$)`)
    const match = md.match(re)
    return match ? match[1].trim() : ''
  }

  const clean = (text: string) =>
    text
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^\[TBD\]$/m, '')
      .trim()

  const vision = clean(section('Project Vision'))
  const currentProgress = clean(section('Current Progress'))
  const nextSteps = clean(section('Next Steps'))

  // Parse pipe table: | M-001 | Name | Goal | Status |
  const milestones: Milestone[] = []
  const tableSection = section('Milestone Backlog')
  const rows = tableSection.match(/^\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|$/gm) ?? []
  for (const row of rows) {
    const cols = row.split('|').map(c => c.trim()).filter(Boolean)
    if (cols.length === 4 && cols[0] !== 'ID' && !cols[0].startsWith('-')) {
      milestones.push({ id: cols[0], name: cols[1], goal: cols[2], status: cols[3] })
    }
  }

  return { vision, currentProgress, nextSteps, milestones }
}

export default function RoadmapPage() {
  // Path: apps/web → apps → goveragent-template → agentic/ROADMAP.md
  const filePath = join(process.cwd(), '..', '..', 'agentic', 'ROADMAP.md')
  let data = { vision: '', currentProgress: '', nextSteps: '', milestones: [] as Milestone[] }

  try {
    const content = readFileSync(filePath, 'utf-8')
    data = parseRoadmap(content)
  } catch {
    // File not found — show empty state
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>
      <Navbar />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 0' }}>
        <BackButton href="/" />
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 24px 20px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em' }}>Project Roadmap</h1>
        </div>
      </div>
      <RoadmapClient data={data} />
    </div>
  )
}
