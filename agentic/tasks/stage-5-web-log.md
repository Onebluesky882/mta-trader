# Dispatch-In: stage-5-web-log

**Stage ID:** stage-5-web-log
**Domain:** apps/web
**Branch:** stage-5-web-log
**Gate-In Verified:** YES

---

## Mission

สร้าง Trade Log page (`/log`) — แสดงประวัติการเทรดทั้งหมด พร้อม pagination และ filter ตามวันที่

---

## Context

- เพิ่ม page ใน apps/web ที่สร้างจาก stage-4
- ข้อมูลมาจาก `GET /api/trades` ตาม CONTRACTS.md
- ต้องมี back button (ตาม CLAUDE.md Navigation Rules)
- ห้ามใช้ `<a href>`, emoji

---

## Deliverables

### 1. Trade Log Page (app/log/page.tsx)

**URL:** `/log`

**ฟีเจอร์:**
- ตาราง trade ทั้งหมด
- Pagination (page size: 50)
- Filter ตาม date range (from / to)
- Back button ด้านบน

**คอลัมน์ในตาราง:**

| คอลัมน์ | ข้อมูล |
|---------|-------|
| Symbol | เช่น EURUSD |
| Direction | BUY / SELL |
| Open Price | ราคาเปิด |
| Close Price | ราคาปิด (หรือ — ถ้ายังเปิด) |
| Open Time | วันเวลาที่เปิด |
| Close Time | วันเวลาที่ปิด |
| Volume | lot size |
| Profit | กำไร/ขาดทุน (สีเขียว/แดง) |
| Status | OPEN / CLOSED |

### 2. TanStack Query Hook (hooks/useTrades.ts)

```ts
export function useTrades(params: {
  page: number
  limit: number
  from?: string
  to?: string
}) {
  return useQuery({
    queryKey: ['trades', params],
    queryFn: () => apiFetch(`/api/trades?${new URLSearchParams(...)}`).then(r => r.json()),
  })
}
```

### 3. Date Filter Component

- input type="date" สำหรับ from และ to
- เมื่อเปลี่ยน → reset page = 1 → refetch

### 4. Pagination Component

- แสดง: Previous / หน้าปัจจุบัน / Next
- disabled Previous ถ้า page = 1
- disabled Next ถ้าไม่มีหน้าถัดไป

### 5. Back Button

```tsx
'use client'
import { useRouter } from 'next/navigation'

export function BackButton() {
  const router = useRouter()
  return (
    <button onClick={() => router.back()}>
      {/* inline SVG arrow left */}
      Back
    </button>
  )
}
```

---

## Acceptance Criteria

- [ ] `/log` แสดงรายการ trade จาก API ได้
- [ ] Pagination ทำงานได้ (next / previous)
- [ ] Date filter กรองข้อมูลได้
- [ ] Back button มีอยู่และทำงานด้วย `router.back()`
- [ ] Profit แสดงสีเขียว (กำไร) / แดง (ขาดทุน)
- [ ] ไม่มี `<a href>` หรือ emoji ใน UI

---

## Rules

- ทุก API call ผ่าน `apiFetch`
- back button ใช้ `router.back()` เท่านั้น
- ห้ามใช้ emoji — inline SVG เท่านั้น
- verify package versions ก่อน install

---

## Gate-Out

เมื่อเสร็จแล้ว สร้าง `agentic/gate-out/stage-5-web-log.md` และ STOP
