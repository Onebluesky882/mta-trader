import { create } from 'zustand'

export type SetupAnswers = {
  language: string
  businessName: string
  businessDescription: string
  targetCustomers: string
  websiteFeatures: string[]
  needsAdminPanel: string
  onlinePayments: string
  preferredStyle: string
  websitePages: string[]
  timeline: string
}

type SetupStore = {
  answers: SetupAnswers
  setAnswer: <K extends keyof SetupAnswers>(key: K, value: SetupAnswers[K]) => void
  reset: () => void
}

const defaultAnswers: SetupAnswers = {
  language: '',
  businessName: '',
  businessDescription: '',
  targetCustomers: '',
  websiteFeatures: [],
  needsAdminPanel: '',
  onlinePayments: '',
  preferredStyle: '',
  websitePages: [],
  timeline: '',
}

export const useSetupStore = create<SetupStore>((set) => ({
  answers: { ...defaultAnswers },
  setAnswer: (key, value) =>
    set((state) => ({ answers: { ...state.answers, [key]: value } })),
  reset: () => set({ answers: { ...defaultAnswers } }),
}))
