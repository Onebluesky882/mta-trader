# Dispatch-In: stage-6-web-settings

**Stage ID:** stage-6-web-settings
**Domain:** apps/web
**Branch:** stage-6-web-settings
**Gate-In Verified:** YES

---

## Mission

สร้าง Algorithm Settings page (`/settings`) — ให้ dev ดูและแก้ไข parameter ของ trading algorithm ได้

---

## Context

- เพิ่ม page ใน apps/web ที่สร้างจาก stage-4
- ข้อมูลมาจาก `GET /api/settings` และอัปเดตด้วย `PUT /api/settings`
- ต้องมี back button
- mutation ใช้ `apiFetch` (Bearer token)

---

## Deliverables

### 1. Settings Page (app/settings/page.tsx)

**URL:** `/settings`

**ฟีเจอร์:**
- แสดง algorithm parameters ปัจจุบัน (dynamic — render ตาม key-value จาก API)
- Form สำหรับแก้ไข parameters
- ปุ่ม Save — PUT /api/settings
- แสดง version ปัจจุบัน และ updated_at
- Back button ด้านบน
- แสดง success/error message หลัง save

### 2. TanStack Query Hooks (hooks/useSettings.ts)

```ts
// GET
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch('/api/settings').then(r => r.json()),
  })
}

// PUT
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: Record<string, unknown>) =>
      apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ params }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
```

### 3. Dynamic Parameter Form

- render input field สำหรับแต่ละ key ใน `params`
- type detection: number → `<input type="number">`, boolean → `<input type="checkbox">`, string → `<input type="text">`
- label = key name (camelCase → readable label)

### 4. Save Confirmation

- แสดง "Saved successfully" หลัง PUT สำเร็จ
- แสดง error message ถ้า API ตอบ error
- ปุ่ม Save disabled ระหว่าง mutation pending

---

## Acceptance Criteria

- [ ] `/settings` แสดง parameters ปัจจุบันจาก API
- [ ] แก้ไข parameters และ Save ได้ (PUT /api/settings)
- [ ] version และ updated_at แสดงถูกต้อง
- [ ] Back button ทำงานด้วย `router.back()`
- [ ] Success / error feedback แสดงหลัง save
- [ ] ไม่มี `<a href>` หรือ emoji ใน UI

---

## Rules

- ทุก API call ผ่าน `apiFetch`
- back button ใช้ `router.back()`
- ห้ามใช้ emoji — inline SVG เท่านั้น

---

## Gate-Out

เมื่อเสร็จแล้ว สร้าง `agentic/gate-out/stage-6-web-settings.md` และ STOP
