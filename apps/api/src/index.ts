import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { health } from './domains/health/health.route'
import { authRouter } from './domains/auth/auth.route'
import { userRouter } from './domains/user/user.route'
import { emailRouter } from './domains/email/email.route'
import { storageRouter } from './domains/storage/storage.route'
import { paymentRouter } from './domains/payment/payment.route'
import { forumRouter } from './domains/forum/forum.route'
import { roadmapRouter } from './domains/roadmap/roadmap.route'
import { agentRouter } from './domains/agent/agent.route'
import { setupRouter } from './domains/setup/setup.route'
// MTA Trader routes
import { mtaAuthRouter } from './routes/auth'
import { dashboardRouter } from './routes/dashboard'
import { tradesRouter } from './routes/trades'
import { settingsRouter } from './routes/settings'
import { optimizeRouter } from './routes/optimize'
import { mt5Router } from './routes/mt5'
import { telegramRouter } from './routes/telegram'
import { aiConfigRouter } from './routes/ai-config'
import { aiSignalRouter } from './routes/ai-signal'
import { accountRouter } from './routes/account'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  OWNER_EMAIL: string
  RESEND_API_KEY: string
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  MT5_WEBHOOK_SECRET: string
  BOT_TOKEN: string
  TELEGRAM_SECRET_TOKEN: string
  TELEGRAM_CHAT_ID: string
  ANTHROPIC_API_KEY: string
  ANTHROPIC_AGENT_ID: string
  ANTHROPIC_ENV_ID: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://atp-bot-trader.pages.dev',
    'https://all-tp-bot-web.onebluesky882.workers.dev',
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

app.route('/health', health)
// MTA Trader: /api/auth/login must be registered before the better-auth catch-all
app.route('/api/auth', mtaAuthRouter)
app.route('/api/auth', authRouter)
app.route('/api/user', userRouter)
app.route('/api/email', emailRouter)
app.route('/api/storage', storageRouter)
app.route('/api/payment', paymentRouter)
app.route('/api/forum', forumRouter)
app.route('/api/roadmap', roadmapRouter)
app.route('/api/agent', agentRouter)
app.route('/api/setup', setupRouter)
// MTA Trader trading routes (all protected)
app.route('/api/dashboard', dashboardRouter)
app.route('/api/trades', tradesRouter)
app.route('/api/settings', settingsRouter)
app.route('/api/optimize', optimizeRouter)
app.route('/api/mt5', mt5Router)
app.route('/webhook', telegramRouter)
app.route('/api/ai-config', aiConfigRouter)
app.route('/api/ai-signal', aiSignalRouter)
app.route('/api/account', accountRouter)

export default app
