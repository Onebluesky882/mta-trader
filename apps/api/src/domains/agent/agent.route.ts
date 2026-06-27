import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import AnthropicSDK from '@anthropic-ai/sdk'
import { createAuth } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createVaultSchema, createSessionSchema, sendMessageSchema, streamQuerySchema, filesQuerySchema, deployNotifySchema, deployCompleteSchema, deployStatusQuerySchema } from './agent.schema'
import { createVault, createAgentSession, sendMessage, streamSession, listSessionFiles } from './agent.handler'

type Bindings = {
  DB: D1Database
  ANTHROPIC_API_KEY: string
  ANTHROPIC_AGENT_ID: string
  ANTHROPIC_ENV_ID: string
  DEPLOY_WEBHOOK_SECRET: string
  SITE_URL: string
}

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://fullstack-builder-web.onebluesky882.workers.dev',
  'https://fullstack-builder-admin.onebluesky882.workers.dev',
]

const agentRouter = new Hono<{ Bindings: Bindings }>()

// Auth helper — returns user or null
async function getUser(c: { req: { raw: Request }; env: Bindings }) {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  return session?.user ?? null
}

// Owner-only guard — returns user if role === 'owner', null otherwise
async function getOwner(c: { req: { raw: Request }; env: Bindings }) {
  const user = await getUser(c)
  if (!user) return null
  if ((user as any).role !== 'owner') return null
  return user
}

// POST /api/agent/vault — create Anthropic Vault and store GitHub PAT
agentRouter.post('/vault', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const parsed = createVaultSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400)

  const { githubPat, githubRepoUrl } = parsed.data

  const { vaultId } = await createVault(c.env.ANTHROPIC_API_KEY, githubPat, githubRepoUrl)

  // Upsert agent_sessions row with vault info
  await c.env.DB
    .prepare(
      'INSERT INTO agent_sessions (id, user_id, vault_id, github_repo_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET vault_id = excluded.vault_id, github_repo_url = excluded.github_repo_url',
    )
    .bind(crypto.randomUUID(), user.id, vaultId, githubRepoUrl, 'vault_created', Date.now())
    .run()

  return c.json({ vaultId })
})

// POST /api/agent/session — create Managed Agents session with github_repository mounted
agentRouter.post('/session', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const parsed = createSessionSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400)

  const { githubRepoUrl, vaultId } = parsed.data

  const { sessionId } = await createAgentSession(
    c.env.ANTHROPIC_API_KEY,
    c.env.ANTHROPIC_AGENT_ID,
    c.env.ANTHROPIC_ENV_ID,
    vaultId,
    githubRepoUrl,
  )

  // Update D1 row with session_id
  await c.env.DB
    .prepare('UPDATE agent_sessions SET session_id = ?, status = ? WHERE user_id = ? AND vault_id = ?')
    .bind(sessionId, 'active', user.id, vaultId)
    .run()

  return c.json({ sessionId })
})

// POST /api/agent/message — send user message to active session
agentRouter.post('/message', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400)

  const { sessionId, message } = parsed.data

  await sendMessage(c.env.ANTHROPIC_API_KEY, sessionId, message)

  return c.json({ ok: true })
})

// GET /api/agent/stream?sessionId=... — SSE stream of agent events, writes agent_logs on complete
agentRouter.get('/stream', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const query = streamQuerySchema.safeParse({ sessionId: c.req.query('sessionId') })
  if (!query.success) return c.json({ error: 'Missing sessionId' }, 400)

  const { sessionId } = query.data
  const correlationId = crypto.randomUUID()
  const startedAt = Date.now()

  return streamSSE(c, async (stream) => {
    const toolCalls: string[] = []
    let outputText = ''
    let tokensInput = 0
    let tokensOutput = 0
    let logStatus = 'success'
    let errorMessage: string | null = null

    try {
      const events = await streamSession(c.env.ANTHROPIC_API_KEY, sessionId)

      for await (const event of events) {
        if (event.type === 'agent.message') {
          for (const block of event.content ?? []) {
            if (block.type === 'text' && block.text) {
              outputText += block.text
              await stream.writeSSE({ event: 'agent_message', data: JSON.stringify({ text: block.text }) })
            }
          }
        }

        if (event.type === 'agent.tool_use') {
          if (event.name) toolCalls.push(event.name)
          await stream.writeSSE({ event: 'tool_use', data: JSON.stringify({ tool: event.name }) })
        }

        if (event.type === 'agent.thinking') {
          for (const block of event.content ?? []) {
            if (block.type === 'thinking' && block.thinking) {
              await stream.writeSSE({ event: 'thinking', data: JSON.stringify({ text: block.thinking }) })
            }
          }
        }

        if ((event.type as string) === 'span.model_request_end') {
          tokensInput = event.usage?.input_tokens ?? tokensInput
          tokensOutput = event.usage?.output_tokens ?? tokensOutput
        }

        if (event.type === 'session.status_idle' || event.type === 'session.status_terminated') {
          await stream.writeSSE({ event: 'done', data: '{}' })
          break
        }
      }
    } catch (err) {
      logStatus = 'error'
      errorMessage = err instanceof Error ? err.message : 'Stream error'
      await stream.writeSSE({ event: 'error', data: JSON.stringify({ error: errorMessage }) })
    } finally {
      await c.env.DB
        .prepare(
          `INSERT INTO agent_logs (id, correlation_id, user_id, session_id, agent_id, input_preview, output_preview, tool_calls, tokens_input, tokens_output, latency_ms, status, error_message, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          correlationId,
          user.id,
          sessionId,
          c.env.ANTHROPIC_AGENT_ID,
          null,
          outputText.slice(0, 300) || null,
          toolCalls.length > 0 ? JSON.stringify(toolCalls) : null,
          tokensInput,
          tokensOutput,
          Date.now() - startedAt,
          logStatus,
          errorMessage,
          Date.now(),
        )
        .run()
    }
  })
})

// GET /api/agent/files?sessionId=... — list files Claude wrote to session outputs
agentRouter.get('/files', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const query = filesQuerySchema.safeParse({ sessionId: c.req.query('sessionId') })
  if (!query.success) return c.json({ error: 'Missing sessionId' }, 400)

  const files = await listSessionFiles(c.env.ANTHROPIC_API_KEY, query.data.sessionId)

  return c.json({ files })
})

// POST /api/agent/deploy-notify — called by frontend when SSE stream ends (Claude finished)
agentRouter.post('/deploy-notify', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json()
  const parsed = deployNotifySchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)

  const { sessionId, siteUrl } = parsed.data

  await c.env.DB
    .prepare('UPDATE agent_sessions SET deploy_status = ?, site_url = ?, pushed_at = ? WHERE session_id = ? AND user_id = ?')
    .bind('deploying', siteUrl, Date.now(), sessionId, user.id)
    .run()

  return c.json({ ok: true })
})

// POST /api/agent/deploy-complete — called by GitHub Actions webhook after wrangler deploy
agentRouter.post('/deploy-complete', async (c) => {
  // Verify webhook secret (not user auth — this is called by GitHub Actions)
  const secret = c.req.header('x-deploy-secret')
  if (!secret || secret !== c.env.DEPLOY_WEBHOOK_SECRET) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json()
  const parsed = deployCompleteSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)

  // Mark all deploying sessions as live
  await c.env.DB
    .prepare("UPDATE agent_sessions SET deploy_status = 'live', deployed_at = ? WHERE deploy_status = 'deploying'")
    .bind(Date.now())
    .run()

  return c.json({ ok: true })
})

// GET /api/agent/deploy-status?sessionId=... — poll deploy status
agentRouter.get('/deploy-status', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const query = deployStatusQuerySchema.safeParse({ sessionId: c.req.query('sessionId') })
  if (!query.success) return c.json({ error: 'Missing sessionId' }, 400)

  const row = await c.env.DB
    .prepare('SELECT deploy_status, site_url, pushed_at, deployed_at FROM agent_sessions WHERE session_id = ? AND user_id = ?')
    .bind(query.data.sessionId, user.id)
    .first<{ deploy_status: string; site_url: string | null; pushed_at: number | null; deployed_at: number | null }>()

  if (!row) return c.json({ error: 'Session not found' }, 404)

  return c.json({
    status: row.deploy_status,
    siteUrl: row.site_url ?? c.env.SITE_URL,
    pushedAt: row.pushed_at,
    deployedAt: row.deployed_at,
  })
})

// GET /api/agent/my-session — return active session for current user (used for session persistence)
agentRouter.get('/my-session', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const row = await c.env.DB
    .prepare(
      `SELECT session_id, vault_id, github_repo_url, status, deploy_status, site_url
       FROM agent_sessions
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(user.id)
    .first<{
      session_id: string | null
      vault_id: string | null
      github_repo_url: string
      status: string
      deploy_status: string
      site_url: string | null
    }>()

  if (!row || !row.session_id) {
    return c.json({ exists: false })
  }

  return c.json({
    exists: true,
    sessionId: row.session_id,
    vaultId: row.vault_id,
    githubRepoUrl: row.github_repo_url,
    deployStatus: row.deploy_status,
    siteUrl: row.site_url ?? c.env.SITE_URL,
  })
})

// GET /api/agent/logs — recent agent logs for the authenticated user
agentRouter.get('/logs', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const rows = await c.env.DB
    .prepare(
      `SELECT id, correlation_id, session_id, agent_id, output_preview, tool_calls, tokens_input, tokens_output, latency_ms, status, error_message, created_at
       FROM agent_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
    )
    .bind(user.id)
    .all<{
      id: string
      correlation_id: string
      session_id: string | null
      agent_id: string | null
      output_preview: string | null
      tool_calls: string | null
      tokens_input: number
      tokens_output: number
      latency_ms: number
      status: string
      error_message: string | null
      created_at: number
    }>()

  return c.json({
    logs: (rows.results ?? []).map((r) => ({
      ...r,
      tool_calls: r.tool_calls ? JSON.parse(r.tool_calls) : [],
    })),
  })
})

// GET /api/agent/file/:fileId — proxy download from Anthropic Files API
agentRouter.get('/file/:fileId', async (c) => {
  const user = await getOwner(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { fileId } = c.req.param()

  const anthropic = new AnthropicSDK({ apiKey: c.env.ANTHROPIC_API_KEY })
  const response = await (anthropic.beta as any).files.download(fileId)

  const arrayBuffer = await response.arrayBuffer()
  const contentType = response.headers?.get('content-type') ?? 'application/octet-stream'

  return new Response(arrayBuffer, {
    headers: { 'Content-Type': contentType },
  })
})

export { agentRouter }
