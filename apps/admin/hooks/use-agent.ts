'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''
const LS_KEY = 'gover_agent_session'

export type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export type DeployStatus = 'idle' | 'pushed' | 'deploying' | 'live' | 'failed'

type PersistedSession = {
  sessionId: string
  vaultId: string
  githubRepoUrl: string
}

type AgentState = {
  vaultId: string | null
  sessionId: string | null
  isSetup: boolean
  isSettingUp: boolean
  isRestoring: boolean
  messages: Message[]
  isStreaming: boolean
  currentTool: string | null
  error: string | null
  deployStatus: DeployStatus
  siteUrl: string | null
}

type AgentHook = AgentState & {
  setupAgent: (githubRepoUrl: string, githubPat: string) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  clearSession: () => void
}

function saveSession(data: PersistedSession) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch { /* ignore */ }
}

function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as PersistedSession) : null
  } catch { return null }
}

function clearSession() {
  try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
}

export function useAgent(): AgentHook {
  const [state, setState] = useState<AgentState>({
    vaultId: null,
    sessionId: null,
    isSetup: false,
    isSettingUp: false,
    isRestoring: true,   // true on mount — checking for existing session
    messages: [],
    isStreaming: false,
    currentTool: null,
    error: null,
    deployStatus: 'idle',
    siteUrl: null,
  })

  const esRef = useRef<EventSource | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // On mount: try to restore session from localStorage → validate with API
  useEffect(() => {
    const persisted = loadSession()
    if (!persisted) {
      setState((s) => ({ ...s, isRestoring: false }))
      return
    }

    fetch(`${API}/api/agent/my-session`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { exists: boolean; sessionId?: string; vaultId?: string; githubRepoUrl?: string; deployStatus?: string; siteUrl?: string | null } | null) => {
        if (data?.exists && data.sessionId) {
          setState((s) => ({
            ...s,
            sessionId: data.sessionId!,
            vaultId: data.vaultId ?? persisted.vaultId,
            isSetup: true,
            isRestoring: false,
            deployStatus: (data.deployStatus as DeployStatus) ?? 'idle',
            siteUrl: data.siteUrl ?? null,
          }))
        } else {
          // Session expired on server — clear local storage
          clearSession()
          setState((s) => ({ ...s, isRestoring: false }))
        }
      })
      .catch(() => {
        // Network error — restore from localStorage optimistically
        setState((s) => ({
          ...s,
          sessionId: persisted.sessionId,
          vaultId: persisted.vaultId,
          isSetup: true,
          isRestoring: false,
        }))
      })
  }, [])

  const setupAgent = useCallback(async (githubRepoUrl: string, githubPat: string) => {
    setState((s) => ({ ...s, isSettingUp: true, error: null }))

    try {
      const vaultRes = await fetch(`${API}/api/agent/vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ githubPat, githubRepoUrl }),
      })
      if (!vaultRes.ok) throw new Error('Failed to create vault')
      const { vaultId } = (await vaultRes.json()) as { vaultId: string }

      const sessionRes = await fetch(`${API}/api/agent/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ githubRepoUrl, vaultId }),
      })
      if (!sessionRes.ok) throw new Error('Failed to create session')
      const { sessionId } = (await sessionRes.json()) as { sessionId: string }

      // Persist to localStorage so page refresh restores session
      saveSession({ sessionId, vaultId, githubRepoUrl })

      setState((s) => ({
        ...s,
        vaultId,
        sessionId,
        isSetup: true,
        isSettingUp: false,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        isSettingUp: false,
        error: err instanceof Error ? err.message : 'Setup failed',
      }))
    }
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!state.sessionId || state.isStreaming) return

      const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text }
      setState((s) => ({
        ...s,
        messages: [...s.messages, userMsg],
        isStreaming: true,
        currentTool: null,
        error: null,
        deployStatus: 'idle',
      }))

      await fetch(`${API}/api/agent/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId: state.sessionId, message: text }),
      })

      let assistantText = ''
      const assistantId = crypto.randomUUID()
      setState((s) => ({
        ...s,
        messages: [...s.messages, { id: assistantId, role: 'assistant', text: '' }],
      }))

      const url = `${API}/api/agent/stream?sessionId=${state.sessionId}`
      const es = new EventSource(url, { withCredentials: true })
      esRef.current = es

      es.addEventListener('agent_message', (e) => {
        const { text: chunk } = JSON.parse(e.data) as { text: string }
        assistantText += chunk
        setState((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === assistantId ? { ...m, text: assistantText } : m,
          ),
        }))
      })

      es.addEventListener('tool_use', (e) => {
        const { tool } = JSON.parse(e.data) as { tool: string }
        setState((s) => ({ ...s, currentTool: tool }))
      })

      es.addEventListener('done', () => {
        es.close()
        esRef.current = null
        setState((s) => ({ ...s, isStreaming: false, currentTool: null, deployStatus: 'pushed' }))
        void notifyAndPollDeploy(state.sessionId!)
      })

      es.addEventListener('error', (e) => {
        const msg = (e as MessageEvent).data
          ? (JSON.parse((e as MessageEvent).data) as { error: string }).error
          : 'Stream error'
        es.close()
        esRef.current = null
        setState((s) => ({ ...s, isStreaming: false, currentTool: null, error: msg }))
      })

      es.onerror = () => {
        es.close()
        esRef.current = null
        setState((s) => ({ ...s, isStreaming: false, currentTool: null }))
      }
    },
    [state.sessionId, state.isStreaming],
  )

  const notifyAndPollDeploy = useCallback(async (sessionId: string) => {
    await fetch(`${API}/api/agent/deploy-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId, siteUrl: '' }),
    })

    setState((s) => ({ ...s, deployStatus: 'deploying' }))

    let attempts = 0
    const maxAttempts = 18

    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        clearInterval(pollRef.current!)
        return
      }
      try {
        const res = await fetch(`${API}/api/agent/deploy-status?sessionId=${sessionId}`, {
          credentials: 'include',
        })
        if (!res.ok) return
        const data = (await res.json()) as { status: string; siteUrl: string | null }
        if (data.status === 'live') {
          clearInterval(pollRef.current!)
          setState((s) => ({ ...s, deployStatus: 'live', siteUrl: data.siteUrl }))
        } else if (data.status === 'failed') {
          clearInterval(pollRef.current!)
          setState((s) => ({ ...s, deployStatus: 'failed' }))
        }
      } catch { /* keep polling */ }
    }, 10_000)
  }, [])

  const handleClearSession = useCallback(() => {
    clearSession()
    if (esRef.current) { esRef.current.close(); esRef.current = null }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setState({
      vaultId: null, sessionId: null, isSetup: false, isSettingUp: false,
      isRestoring: false, messages: [], isStreaming: false, currentTool: null,
      error: null, deployStatus: 'idle', siteUrl: null,
    })
  }, [])

  return { ...state, setupAgent, sendMessage, clearSession: handleClearSession }
}
