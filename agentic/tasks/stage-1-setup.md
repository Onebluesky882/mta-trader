# Dispatch-In: stage-1-setup

**Stage ID:** stage-1-setup
**Domain:** root
**Branch:** stage-1-setup
**Gate-In Verified:** YES

---

## Mission

ตั้งค่า Monorepo ให้พร้อมสำหรับการพัฒนา — workers ทุก stage ที่ตามมาจะ build บน foundation นี้

---

## Context

โปรเจกต์ mta-trader เป็น Greenfield Monorepo สำหรับ Forex trading bot บน MT5
Stack: TypeScript, pnpm workspaces, Next.js (apps/web), Hono (apps/api), packages/auth
Deployment: Cloudflare Workers (API) + Cloudflare Pages (Web)

---

## Deliverables

### 1. pnpm Workspace

สร้าง `pnpm-workspace.yaml` ที่ root:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

โครงสร้าง directory เป้าหมาย:

```
mta-trader/
├── apps/
│   ├── web/          # scaffold ด้วย create-next-app@latest
│   └── api/          # scaffold ด้วย Hono + Cloudflare Workers template
├── packages/
│   └── auth/         # สร้างเอง (ไม่ใช้ template)
├── pnpm-workspace.yaml
├── package.json      # root workspace package
└── turbo.json        # (optional)
```

**Bootstrap apps/web ด้วย:**

```bash
cd apps
pnpm create next-app@latest web \
  --typescript \
  --tailwind \
  --app \
  --no-eslint \
  --no-src-dir \
  --import-alias "@/*"
```

> ใช้ `--no-eslint` เพราะโปรเจกต์ใช้ **Biome** แทน ESLint

**Bootstrap apps/api ด้วย Hono + Cloudflare Workers:**

```bash
cd apps
pnpm create hono@latest api \
  --template cloudflare-workers
```

> หลัง scaffold ให้ตรวจสอบ `wrangler.toml` และเพิ่ม D1 binding ตามที่กำหนดใน Deliverable ข้อ 6

### 2. TypeScript

สร้าง `tsconfig.base.json` ที่ root สำหรับ shared config
แต่ละ package มี `tsconfig.json` ของตัวเอง extend จาก base

### 3. Biome

ติดตั้ง Biome ที่ root และสร้าง `biome.json`:
- formatter: enabled (indent 2 spaces)
- linter: enabled (recommended rules)
- organizeImports: enabled

เพิ่ม scripts ใน root `package.json`:
```json
"lint": "biome check .",
"format": "biome format --write .",
"check": "biome check --write ."
```

### 4. Vitest

ติดตั้ง Vitest ที่ root และ config `vitest.config.ts`:
- coverage: v8
- environment: node (default)
- include: `**/*.test.ts`

เพิ่ม script: `"test": "vitest run"`

### 5. Playwright

ติดตั้ง Playwright และสร้าง `playwright.config.ts`:
- baseURL: `http://localhost:3000`
- testDir: `e2e/`
- browsers: chromium

สร้าง `e2e/` directory พร้อม `.gitkeep`

เพิ่ม script: `"test:e2e": "playwright test"`

### 6. Cloudflare Wrangler (apps/api)

สร้าง `apps/api/wrangler.toml`:

```toml
name = "mta-trader-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "mta-trader-db"
database_id = "PLACEHOLDER"  # Dev fills this after wrangler d1 create
```

### 7. Root package.json

```json
{
  "name": "mta-trader",
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "build": "pnpm -r build",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lint": "biome check .",
    "format": "biome format --write ."
  }
}
```

### 8. .gitignore

ต้องครอบคลุม:
- `node_modules/`
- `.env`, `.env.local`, `.env.production`, `.env.development`
- `.wrangler/`
- `dist/`, `.next/`, `out/`
- `coverage/`
- `*.tsbuildinfo`

---

## Acceptance Criteria

- [ ] `pnpm install` รันได้ที่ root โดยไม่มี error
- [ ] `pnpm lint` รันได้ (Biome)
- [ ] `pnpm test` รันได้ (Vitest — pass ด้วย 0 tests ถ้ายังไม่มี test file)
- [ ] `pnpm test:e2e` รันได้ (Playwright)
- [ ] `apps/api/wrangler.toml` มีอยู่และ valid
- [ ] TypeScript configured ครบทุก package
- [ ] `.gitignore` ครอบคลุม secrets และ build artifacts

---

## Rules

- ใช้ `@latest` สำหรับทุก bootstrap command
- verify version ก่อน install ทุก package: `npm info <package> version`
- ห้าม commit `.env` files
- ห้าม modify governance files ใน `agentic/`
- บันทึก verified version ทุกตัวใน gate-out `dependencies_added`

---

## Gate-Out

เมื่อเสร็จแล้ว สร้าง `agentic/gate-out/stage-1-setup.md` และ STOP
