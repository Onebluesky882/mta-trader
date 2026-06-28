import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'ATP Bot Trader',
  description: 'Forex trading bot dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <QueryProvider>
          <Navbar />
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
