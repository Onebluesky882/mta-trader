# ARCHITECTURE.md

## Overview

mta-trader เป็น Monorepo สำหรับ Forex trading bot บน MT5 — ประกอบด้วย web dashboard (Next.js) สำหรับ monitor และ configure, API backend (Hono on Cloudflare Workers), และ MT5 bridge layer สำหรับรับ/ส่ง signal กับ MetaTrader 5

Architecture style: **Monorepo**

```
mta-trader/
├── apps/
│   ├── web/          # Next.js dashboard (frontend)
│   └── api/          # Hono API (Cloudflare Workers)
├── packages/
│   └── auth/         # Bearer token auth shared package
└── agentic/          # Governance files (read-only to workers)
```

⸻

## Modules / Components

| Module | Domain | Responsibility |
|--------|--------|----------------|
| `apps/web` | Frontend | Dashboard, Trade Log, Settings, Optimize pages |
| `apps/api` | Backend | REST API — trade data, algorithm config, optimize history |
| `packages/auth` | Auth | Bearer token validation, session management |
| MT5 Bridge | Integration | รับ signal จาก MT5 / ส่ง order กลับ MT5 (MQL5 script หรือ Python bridge) |

### Pages (apps/web)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | แสดง trade ที่รันอยู่, P&L, สถานะ bot |
| Trade Log | `/log` | ประวัติการเทรดทั้งหมด |
| Algorithm Settings | `/settings` | ตั้งค่า parameter ของ algorithm |
| Optimize | `/optimize` | เปรียบเทียบ config รูปแบบต่างๆ และวัดผล |
| Optimize History | `/optimize/history` | ประวัติการแก้ไข config พร้อม diff และผลลัพธ์ |

⸻

## Data Flow

```
MT5 (MetaTrader 5)
    ↕ MQL5 / Python bridge
apps/api (Hono — Cloudflare Workers)
    ↕ Cloudflare D1 (SQLite)
apps/web (Next.js — Cloudflare Pages)
    ← TanStack Query (server state)
    ← Zustand (client state)
```

⸻

## External Dependencies

| Service | Purpose |
|---------|---------|
| Cloudflare Workers | API hosting |
| Cloudflare Pages | Web dashboard hosting |
| Cloudflare D1 | Database (SQLite) |
| MetaTrader 5 | Forex trading platform |

⸻

## Constraints

- ห้าม `<a href>` สำหรับ internal navigation — ใช้ Next.js `Link` หรือ `router.push()` เท่านั้น
- ทุก authenticated mutation ต้องใช้ Bearer token — ไม่ใช้ cookie (cross-domain subdomain issue)
- ห้าม commit secrets — ใช้ Cloudflare Wrangler secrets เท่านั้น
- ทุกหน้ายกเว้น `/` ต้องมี back button
- ห้ามใช้ emoji ใน UI — ใช้ inline SVG เท่านั้น
- package versions ต้องเป็น latest stable (ดู DECISIONS.md — Version Policy)
