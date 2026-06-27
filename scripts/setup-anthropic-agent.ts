/**
 * One-time setup script — run once per deployment environment.
 * Creates the shared Anthropic Environment and Agent.
 * Output the printed IDs to wrangler secret put.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/setup-anthropic-agent.ts
 */

import Anthropic from '@anthropic-ai/sdk'

// Managed Agents does not expose output_config.effort directly on the agent definition.
// Instead, thorough behavior is enforced via the system prompt.
// Claude Opus 4.8 defaults to high effort internally.
const AGENT_SYSTEM_PROMPT = `You are an expert software engineer helping non-technical clients update their web application.

## Context
Files are mounted at /workspace/. The client's GitHub repository is checked out there.
The project uses TypeScript, Next.js (apps/web, apps/admin), Hono on Cloudflare Workers (apps/api), and Cloudflare D1 as the database.

## Work quality
- Be thorough. Read all relevant files before making any change.
- Understand the existing code patterns before writing new code.
- When a request is ambiguous, make the most reasonable interpretation and note what you assumed.
- Never skip steps to go faster — accuracy matters more than speed.

## When making changes
1. Read the file(s) you will modify first
2. Read related files that might be affected
3. Make the change using write or edit tools
4. Verify the change makes sense in context
5. After all edits: git add -A && git commit -m "<description>" && git push origin main

## Code rules
- Follow existing code style and patterns exactly
- Make only the changes requested — never refactor unrelated code
- No comments unless the logic is genuinely non-obvious
- No emoji in UI code — SVG icons only
- No <a href> for internal Next.js links — use Link or router.push

## Response format
After completing the task:
1. State what you changed (file names and what changed)
2. State what the client will see differently on their site
3. Confirm the push was successful

Keep the summary brief and use plain language — the client is not a developer.`

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY env var is required')
    process.exit(1)
  }

  const anthropic = new Anthropic({ apiKey })

  console.log('Creating Anthropic Environment...')
  const environment = await (anthropic.beta as any).environments.create({
    name: 'gover-agent-code-env',
    config: {
      type: 'cloud',
      networking: { type: 'unrestricted' },
    },
  })
  console.log(`✓ Environment created: ${environment.id}`)

  console.log('\nCreating Anthropic Agent...')
  const agent = await (anthropic.beta as any).agents.create({
    name: 'GoverAgent Code Editor',
    // claude-opus-4-8: adaptive thinking on, high effort internally
    model: 'claude-opus-4-8',
    system: AGENT_SYSTEM_PROMPT,
    tools: [
      {
        type: 'agent_toolset_20260401',
        default_config: { enabled: true },
      },
    ],
  })
  console.log(`✓ Agent created: ${agent.id}`)

  console.log('\n─────────────────────────────────────────')
  console.log('Add these as Cloudflare secrets:')
  console.log('')
  console.log(`wrangler secret put ANTHROPIC_ENV_ID`)
  console.log(`  → value: ${environment.id}`)
  console.log('')
  console.log(`wrangler secret put ANTHROPIC_AGENT_ID`)
  console.log(`  → value: ${agent.id}`)
  console.log('─────────────────────────────────────────')
  console.log('\nAlso add to .dev.vars for local development:')
  console.log(`ANTHROPIC_ENV_ID=${environment.id}`)
  console.log(`ANTHROPIC_AGENT_ID=${agent.id}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
