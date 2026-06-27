import { createAuthClient } from 'better-auth/client'

export function createClient(baseURL: string) {
  return createAuthClient({ baseURL })
}

export type AuthClient = ReturnType<typeof createClient>
