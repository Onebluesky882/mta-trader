// Thin re-export so all pages reading useAppStore get the same persisted token as useAuthStore
export { useAuthStore as useAppStore } from './auth.store'
