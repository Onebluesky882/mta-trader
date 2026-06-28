import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppStore {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    { name: 'mta-app' },
  ),
)
