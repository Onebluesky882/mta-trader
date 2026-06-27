# Dispatch-In: stage-2-auth

**Stage ID:** stage-2-auth
**Domain:** packages/auth
**Branch:** stage-2-auth
**Gate-In Verified:** YES

---

## Mission

สร้าง shared auth package สำหรับ Bearer token — ทุก API route ที่ต้องการ authentication จะใช้ package นี้

---

## Context

- Auth ใช้ **Bearer token** เท่านั้น — ไม่ใช้ cookie (เหตุผล: workers.dev subdomain ไม่ share cookie)
- package นี้จะถูก import โดย `apps/api`
- เจ้าของโปรเจกต์: `wansing05@gmail.com` — ต้องได้รับ `role = 'owner'` ใน DB หลัง deploy ครั้งแรก

---

## Deliverables

### 1. โครงสร้าง packages/auth

```
packages/auth/
├── src/
│   ├── auth.ts        # หลัก — token generation และ validation
│   ├── middleware.ts  # Hono middleware
│   └── index.ts      # exports
├── package.json
└── tsconfig.json
```

### 2. auth.ts

- `generateToken(userId: string, role: string): string` — สร้าง JWT
- `verifyToken(token: string): { userId: string, role: string } | null` — validate JWT
- ใช้ `jose` library (WebCrypto-compatible กับ Cloudflare Workers)
- JWT secret มาจาก environment variable `JWT_SECRET` — ห้าม hardcode

### 3. middleware.ts (Hono middleware)

```ts
export const authMiddleware = (): MiddlewareHandler => async (c, next) => {
  // อ่าน Authorization: Bearer <token>
  // verify token
  // set c.set('user', { userId, role })
  // ถ้า invalid → return 401 { error: "unauthorized", code: "UNAUTHORIZED" }
}
```

### 4. Login endpoint (ใน apps/api)

Worker stage-2 สร้าง `apps/api/src/routes/auth.ts`:

**POST /api/auth/login**

Input:
```ts
{ email: string, password: string }
```

Output:
```ts
{ token: string, expiresAt: string }
```

Error:
```ts
{ error: string, code: "INVALID_CREDENTIALS" | "INTERNAL_ERROR" }
```

- password ต้อง hash ด้วย `bcryptjs` หรือ `@node-rs/bcrypt`
- ห้าม return password hash ใน response ใดๆ

### 5. D1 Database Schema (users table)

สร้าง `apps/api/src/db/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

สร้าง seed script สำหรับ insert owner:
```sql
-- apps/api/src/db/seed-owner.sql
-- Run after first deploy: wrangler d1 execute mta-trader-db --file=seed-owner.sql
INSERT OR IGNORE INTO users (id, email, password_hash, role)
VALUES ('owner-001', 'wansing05@gmail.com', '<bcrypt-hash>', 'owner');
```

> Conductor note: Dev ต้อง generate bcrypt hash และใส่ก่อน run seed

### 6. Unit Tests

สร้าง `packages/auth/src/auth.test.ts`:
- test generateToken + verifyToken (valid token)
- test verifyToken กับ invalid token → null
- test verifyToken กับ expired token → null

---

## Acceptance Criteria

- [ ] `packages/auth` build ได้โดยไม่มี TypeScript error
- [ ] Unit tests ผ่านทั้งหมด (`pnpm test`)
- [ ] `POST /api/auth/login` ทำงานได้ (manual test ด้วย curl)
- [ ] JWT ไม่มี secret hardcoded ใน code
- [ ] password ไม่ถูก log หรือ return ใน response
- [ ] users table schema สร้างได้ใน D1

---

## Rules

- ใช้ Bearer token เท่านั้น — ห้ามใช้ cookie สำหรับ auth
- ห้าม commit `.env` files หรือ JWT secret
- `JWT_SECRET` ต้องใช้ `wrangler secret put JWT_SECRET`
- verify package versions ก่อน install ทุกตัว
- ห้าม modify governance files ใน `agentic/`

---

## Gate-Out

เมื่อเสร็จแล้ว สร้าง `agentic/gate-out/stage-2-auth.md` และ STOP
