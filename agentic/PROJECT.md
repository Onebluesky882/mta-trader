# PROJECT.md

## Project Name
mta-trader

## Goal
Bot trader สำหรับ Forex บน MT5 — รันอัลกอริทึมการเทรดที่กำหนดเองโดย dev เพื่อ automate การซื้อขายในตลาด Forex

**หน้าหลัก:**
- Dashboard — แสดง trade ที่รันอยู่และ P&L
- Log ประวัติการเทรด
- Settings algorithm
- Optimize — เปรียบเทียบและวัดผล config รูปแบบต่างๆ พร้อมประวัติการแก้ไข

## Tech Stack
- Language: TypeScript
- Frontend: Next.js (Cloudflare Pages)
- Backend: Hono (Cloudflare Workers)
- Database: Cloudflare D1 (SQLite)
- Auth: Bearer token (packages/auth)
- Package manager: pnpm
- Linting: Biome
- Testing: Vitest + Playwright
- State: TanStack Query + Zustand

## Team / Agents
เจ้าของโปรเจกต์คนเดียว — ทดลองใช้งานส่วนตัวก่อน

## Current Stage
Greenfield — เริ่มต้นจากศูนย์

---

## Status
ACTIVE

---

## License

```
license_status: active
```

<!-- Dev sets this to "active" before any work begins. -->
<!-- Conductor checks this field before every dispatch. -->
<!-- See CONDUCTOR.md → PRE-FLIGHT CHECK for enforcement. -->

---

## Config

```
conductor_branch: main
owner_email: wansing05@gmail.com
```

<!-- conductor_branch: the branch all PRs merge into (answer from QUESTIONS.md Q23) -->
<!-- owner_email: the user who gets owner role after first deploy (answer from QUESTIONS.md Q0) -->

