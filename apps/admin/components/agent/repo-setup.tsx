'use client'
import { useState } from 'react'

type Props = {
  onSetup: (githubRepoUrl: string, githubPat: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function RepoSetup({ onSetup, isLoading, error }: Props) {
  const [repoUrl, setRepoUrl] = useState('')
  const [pat, setPat] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl.trim() || !pat.trim()) return
    await onSetup(repoUrl.trim(), pat.trim())
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#0f172a' }}>
        Connect your GitHub repository
      </h2>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
        Claude will read and edit files in your repository. Your GitHub token is stored securely
        and never saved to our database.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label
            htmlFor="repoUrl"
            style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}
          >
            Repository URL
          </label>
          <input
            id="repoUrl"
            type="url"
            placeholder="https://github.com/your-username/your-repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              color: '#0f172a',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="pat"
            style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}
          >
            GitHub Personal Access Token
          </label>
          <input
            id="pat"
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              color: '#0f172a',
            }}
          />
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Needs read + write access to Contents. Create one at GitHub Settings → Developer settings → Personal access tokens.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#dc2626',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !repoUrl.trim() || !pat.trim()}
          style={{
            padding: '10px 20px',
            background: isLoading ? '#94a3b8' : '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          {isLoading ? 'Connecting...' : 'Connect repository'}
        </button>
      </form>
    </div>
  )
}
