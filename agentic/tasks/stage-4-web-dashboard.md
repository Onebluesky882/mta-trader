# Dispatch-In: stage-4-web-dashboard

**Stage ID:** stage-4-web-dashboard
**Domain:** apps/web
**Branch:** stage-4-web-dashboard
**Gate-In Verified:** YES

---

## Mission

สร้าง Next.js web app พร้อม Dashboard page หลัก — รวมถึง Navbar, layout, และ infrastructure สำหรับ pages ที่จะตามมา (stage-5, 6, 7)

---

## Context

- Frontend: **Next.js** (App Router) บน Cloudflare Pages
- State: **TanStack Query** (server state) + **Zustand** (client state)
- Auth: Bearer token — ใช้ `apiFetch` hook แทน `fetch` โดยตรง
- ห้ามใช้ `<a href>` สำหรับ internal navigation — ใช้ `<Link>` หรือ `router.push()`
- ห้ามใช้ emoji ใน UI — ใช้ inline SVG เท่านั้น
- ทุกหน้ายกเว้น `/` ต้องมี back button

---

## Deliverables

### 1. โครงสร้าง apps/web

```
apps/web/
├── app/
│   ├── layout.tsx         # root layout + Navbar
│   ├── page.tsx           # Dashboard (/)
│   └── globals.css
├── components/
│   ├── Navbar.tsx         # logo → / , navigation links
│   └── BackButton.tsx     # ใช้ router.back()
├── hooks/
│   ├── useApi.ts          # apiFetch — Bearer token
│   └── useDashboard.ts    # TanStack Query hook สำหรับ /api/dashboard
├── store/
│   └── useAppStore.ts     # Zustand store
├── next.config.ts
├── package.json
└── tsconfig.json
```

### 2. Navbar (components/Navbar.tsx)

- Logo/brand name → `<Link href="/">mta-trader</Link>`
- Navigation links ใช้ `<Link>` เท่านั้น
- Links ที่ต้องมี: Dashboard (`/`), Log (`/log`), Settings (`/settings`), Optimize (`/optimize`)

### 3. apiFetch hook (hooks/useApi.ts)

```ts
export function useApi() {
  const apiFetch = async (path: string, options?: RequestInit) => {
    const token = // get from Zustand store หรือ localStorage
    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
    })
  }
  return { apiFetch }
}
```

`API_BASE_URL` มาจาก `NEXT_PUBLIC_API_URL` environment variable

### 4. Dashboard Page (app/page.tsx)

แสดงข้อมูลจาก `GET /api/dashboard`:

| Card | ข้อมูล |
|------|-------|
| Bot Status | RUNNING / STOPPED / ERROR (พร้อม indicator สี) |
| Open Trades | จำนวน trade ที่เปิดอยู่ |
| Today P&L | กำไร/ขาดทุนวันนี้ |
| Total P&L | กำไร/ขาดทุนรวมทั้งหมด |
| Win Rate | % |

- ใช้ TanStack Query (`useQuery`) fetch ข้อมูล
- แสดง loading state และ error state
- refresh ทุก 30 วินาที (`refetchInterval: 30000`)

### 5. Zustand Store (store/useAppStore.ts)

```ts
interface AppStore {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
}
```

### 6. Login Page (app/login/page.tsx)

- Form: email + password
- POST /api/auth/login ผ่าน apiFetch
- บันทึก token ใน Zustand store
- redirect ไป `/` หลัง login สำเร็จ
- ไม่มี back button (entry point)

---

## Acceptance Criteria

- [ ] `pnpm build` (apps/web) ผ่านโดยไม่มี error
- [ ] Dashboard page แสดงข้อมูลจาก API ได้
- [ ] Navbar มี logo link ไป `/`
- [ ] ไม่มี `<a href>` สำหรับ internal navigation ใดๆ
- [ ] ไม่มี emoji ใน UI code
- [ ] Login flow ทำงานได้ (token บันทึกใน store)
- [ ] Loading + error state แสดงบน Dashboard

---

## Rules

- ทุก API call ผ่าน `apiFetch` — ไม่ใช้ `fetch` โดยตรง
- Logo ต้อง link ไป `/` เสมอ
- ห้ามใช้ emoji — inline SVG เท่านั้น
- internal navigation ใช้ `<Link>` หรือ `router.push()` เท่านั้น
- verify package versions ก่อน install

---

## Gate-Out

เมื่อเสร็จแล้ว สร้าง `agentic/gate-out/stage-4-web-dashboard.md` และ STOP
