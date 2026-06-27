import Anthropic from '@anthropic-ai/sdk'

const AGENT_SYSTEM_PROMPT = `You are an expert software engineer helping clients update their web application.

Files are mounted at /workspace/. The client's GitHub repository is checked out there.

When making changes:
1. Read the relevant files first to understand the current code
2. Use the write or edit tools to make changes
3. After all edits are done, commit and push:
   git add -A && git commit -m "<brief description of change>" && git push origin main
4. Summarize what you changed and why

Always:
- Follow the existing code style and patterns
- Make only the changes requested — do not refactor unrelated code
- Write clear commit messages describing what changed`

export async function createVault(
  apiKey: string,
  githubPat: string,
  githubRepoUrl: string,
): Promise<{ vaultId: string }> {
  const anthropic = new Anthropic({ apiKey })
  const repoName = githubRepoUrl.split('/').pop() ?? 'repo'

  const vault = await (anthropic.beta as any).vaults.create({
    name: `client-vault-${repoName}-${Date.now()}`,
  })

  await (anthropic.beta as any).vaults.credentials.create(vault.id, {
    display_name: 'GitHub PAT',
    auth: {
      type: 'environment_variable',
      secret_name: 'GITHUB_TOKEN',
      secret_value: githubPat,
      networking: { type: 'unrestricted' },
    },
  })

  return { vaultId: vault.id }
}

export async function createAgentSession(
  apiKey: string,
  agentId: string,
  envId: string,
  vaultId: string,
  githubRepoUrl: string,
): Promise<{ sessionId: string }> {
  const anthropic = new Anthropic({ apiKey })

  const session = await (anthropic.beta as any).sessions.create({
    agent: agentId,
    environment_id: envId,
    title: `Code editing — ${githubRepoUrl.split('/').pop()}`,
    vault_ids: [vaultId],
    resources: [
      {
        type: 'github_repository',
        url: githubRepoUrl,
        mount_path: '/workspace',
        checkout: { type: 'branch', name: 'main' },
      },
    ],
  })

  return { sessionId: session.id }
}

export async function sendMessage(
  apiKey: string,
  sessionId: string,
  message: string,
): Promise<void> {
  const anthropic = new Anthropic({ apiKey })

  await (anthropic.beta as any).sessions.events.send(sessionId, {
    events: [
      {
        type: 'user.message',
        content: [{ type: 'text', text: message }],
      },
    ],
  })
}

export async function streamSession(
  apiKey: string,
  sessionId: string,
): Promise<AsyncIterable<any>> {
  const anthropic = new Anthropic({ apiKey })
  return (anthropic.beta as any).sessions.events.stream(sessionId)
}

export async function listSessionFiles(
  apiKey: string,
  sessionId: string,
): Promise<{ id: string; filename: string; size_bytes: number }[]> {
  const anthropic = new Anthropic({ apiKey })

  const files = await (anthropic.beta as any).files.list(
    { scope_id: sessionId },
    { headers: { 'anthropic-beta': 'managed-agents-2026-04-01' } },
  )

  return (files.data ?? []).map((f: any) => ({
    id: f.id,
    filename: f.filename,
    size_bytes: f.size_bytes ?? 0,
  }))
}

export { AGENT_SYSTEM_PROMPT }
