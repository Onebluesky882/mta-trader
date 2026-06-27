# Fullstack Template — AI-Governed

A production-ready fullstack starter with a built-in AI governance system.
Build your product by chatting with AI — no manual setup from scratch.

---

## How to Use This Template

1. Click **"Use this template"** → **"Create a new repository"** on GitHub
2. Name your repo and set visibility (private recommended)
3. Clone your new repo locally
4. Open it in **Claude Code**
5. Type `start-here` — the AI will start asking setup questions immediately, one at a time
6. Answer each question and follow the guide

That's it. The AI handles the rest.

---

## Who is this for?

| You are | What you get |
|---------|-------------|
| **Developer** | A fullstack monorepo ready to extend — auth, payments, storage, email, admin dashboard |
| **Business owner** | A complete website built for you through plain-language conversation — no coding required |

**First step:** open Claude Code and answer one question:

> "Are you a developer, or a business owner who wants to build a website?"

The AI will guide you from there.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + OpenNext |
| Backend | Hono on Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Auth | Better Auth |
| Storage | Cloudflare R2 (presigned URLs) |
| Email | Resend |
| Payment | Stripe |
| Deploy | Cloudflare Workers + Wrangler |
| Package manager | pnpm (monorepo) |
| Build | Turborepo |
| Linting | Biome |
| Language | TypeScript (strict) |

---

## Project Structure

```
apps/
  web/          Next.js — public site (landing, onboarding, auth, forum, roadmap)
  admin/        Next.js — admin dashboard (users, storage, emails, settings)
  api/          Hono — Cloudflare Worker (all API domains)

packages/
  auth/         Better Auth config + client
  db/           Drizzle schema + D1 client + migrations
  email/        Resend templates (welcome, reset, notification)
  ui/           Shared React components
  config/       Shared tsconfig + Biome config

agentic/        AI governance system (Conductor + Worker workflow)
  QUESTIONS.md        Developer setup questionnaire
  CUSTOMER_SETUP.md   Business owner onboarding guide
  PIPELINE.md         Stage definitions and status
  CONDUCTOR.md        Conductor orchestration rules
  DESIGN_SYSTEM.md    UI/animation standards
  START_HERE.md       Worker mandatory entry point
  tasks/              Stage dispatch files
  gate-out/           Worker completion reports
  merge-approval/     Conductor approval files
```

---

## Quick Start (Developer)

### Prerequisites

- Node.js 18+
- pnpm
- Wrangler CLI: `npm i -g wrangler`
- Cloudflare account (free)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
pnpm install
```

### 2. Set client type

```bash
echo "DEVELOPER" > agentic/CLIENT_TYPE.md
```

### 3. Answer setup questions

Open `agentic/QUESTIONS.md` and answer all questions.
Then tell the AI Conductor — it will update all governance files automatically.

### 4. Wrangler login

```bash
wrangler login
wrangler whoami
```

### 5. Create D1 database

```bash
wrangler d1 create YOUR_APP_NAME-db
# Copy the database_id into apps/api/wrangler.toml
```

### 6. Run database migration

```bash
wrangler d1 execute YOUR_APP_NAME-db --remote --file packages/db/migrations/auth.sql
```

### 7. Set environment variables

```bash
# Copy and fill in
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.local.example apps/web/.env.local
cp apps/admin/.env.local.example apps/admin/.env.local
```

### 8. Deploy

```bash
cd apps/api   && wrangler deploy
cd apps/web   && opennextjs-cloudflare build && wrangler deploy
cd apps/admin && opennextjs-cloudflare build && wrangler deploy
```

---

## Quick Start (Business Owner)

You do not need to touch code.

1. Make sure Claude Code is installed
2. Open this project in Claude Code
3. Type: **"I want to build a website for my business"**
4. The AI will ask you questions in plain language and build everything for you

---

## API Domains

| Route | Domain |
|-------|--------|
| `GET /health` | Health check |
| `POST /api/auth/*` | Better Auth (signup, signin, signout) |
| `GET /api/user/me` | Current session user |
| `POST /api/email/welcome` | Send welcome email (Resend) |
| `POST /api/email/notify` | Send notification email |
| `POST /api/storage/presign/upload` | R2 presigned upload URL |
| `POST /api/storage/presign/download` | R2 presigned download URL |
| `GET /api/storage/files` | List files in R2 bucket |
| `DELETE /api/storage/file` | Delete file from R2 |
| `GET /api/payment/config` | Stripe publishable key |
| `POST /api/payment/intent` | Create payment intent |
| `POST /api/payment/checkout` | Create Stripe checkout session |
| `POST /api/payment/webhook` | Stripe webhook handler |

---

## Extending the Template (Developer)

### Adding a new API domain

```
apps/api/src/domains/<name>/
  <name>.schema.ts   — Zod request/response schemas
  <name>.handler.ts  — business logic functions
  <name>.route.ts    — Hono router, auth guard, mount here
```

Mount in `apps/api/src/index.ts`:
```ts
import { myRouter } from './domains/my-domain/my-domain.route'
app.route('/api/my-domain', myRouter)
```

### Adding a new admin page

```
apps/admin/app/(dashboard)/<page>/page.tsx
```

Add the route to `NAV_LINKS` in the dashboard layout.

---

## AI Governance System

This template uses a **Conductor / Worker** multi-agent workflow.

```
Dev        →  sets project direction
Conductor  →  orchestrates stages, dispatches workers, validates, deploys
Workers    →  execute one assigned stage each, in their own domain
```

**Authority order:** Dev > Conductor > Workers

All governance files live in `agentic/`. Read `agentic/START_HERE.md` before any task.

---

## Environment Variables

| File | Purpose |
|------|---------|
| `apps/api/.dev.vars` | API secrets (Resend, Stripe, R2, Anthropic) |
| `apps/web/.env.local` | Web public vars (API URL, App name) |
| `apps/admin/.env.local` | Admin public vars (API URL) |

Copy the `.example` files and fill in your values before running locally.
Never commit `.dev.vars` or `.env.local` files.
