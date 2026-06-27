/**
 * Set project owner role in D1 database.
 *
 * Usage:
 *   npx tsx scripts/set-owner.ts --email owner@example.com --db fullstack-builder-db
 *
 * Flags:
 *   --email   (required) email of the user to promote to owner
 *   --db      (optional) D1 database name, defaults to fullstack-builder-db
 *   --local   (optional) run against local D1 instead of remote
 */

import { execSync } from 'node:child_process'

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

const email = arg('email')
const dbName = arg('db') ?? 'fullstack-builder-db'
const isLocal = process.argv.includes('--local')

if (!email) {
  console.error('ERROR: --email is required')
  console.error('Usage: npx tsx scripts/set-owner.ts --email owner@example.com')
  process.exit(1)
}

const target = isLocal ? '--local' : '--remote'

console.log(`Setting owner: ${email}`)
console.log(`Database: ${dbName} (${isLocal ? 'local' : 'remote'})`)
console.log('')

const checkCmd = `wrangler d1 execute ${dbName} ${target} --command "SELECT id, email, role FROM user WHERE email = '${email}'"  --json`

let checkResult: { results: { id: string; email: string; role: string }[] }[]
try {
  const output = execSync(checkCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
  checkResult = JSON.parse(output)
} catch (err) {
  console.error('ERROR: Failed to query database. Is wrangler logged in?')
  console.error('Run: wrangler whoami')
  process.exit(1)
}

const rows = checkResult?.[0]?.results ?? []

if (rows.length === 0) {
  console.error(`ERROR: No user found with email "${email}"`)
  console.error('The user must sign up first before being promoted to owner.')
  process.exit(1)
}

const current = rows[0]!
if (current.role === 'owner') {
  console.log(`✓ ${email} is already owner — no change needed.`)
  process.exit(0)
}

console.log(`Found user: ${current.id} (current role: ${current.role})`)

const updateCmd = `wrangler d1 execute ${dbName} ${target} --command "UPDATE user SET role = 'owner' WHERE email = '${email}'"  --json`

try {
  execSync(updateCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
} catch {
  console.error('ERROR: Failed to update role.')
  process.exit(1)
}

const verifyCmd = `wrangler d1 execute ${dbName} ${target} --command "SELECT email, role FROM user WHERE email = '${email}'"  --json`
const verifyOutput = execSync(verifyCmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })
const verifyResult = JSON.parse(verifyOutput) as { results: { email: string; role: string }[] }[]
const updated = verifyResult?.[0]?.results?.[0]

if (updated?.role === 'owner') {
  console.log(`✓ Success — ${email} is now owner.`)
  console.log('')
  console.log('This user can now:')
  console.log('  • Access the AI Editor (/agent)')
  console.log('  • View Observability logs (/observability)')
  console.log('  • Manage all admin features')
} else {
  console.error('ERROR: Update ran but role was not changed. Check D1 permissions.')
  process.exit(1)
}
