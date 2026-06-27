# Dispatch-In: stage-7-web-optimize

**Stage ID:** stage-7-web-optimize
**Domain:** apps/web
**Branch:** stage-7-web-optimize
**Gate-In Verified:** NO

---

## Mission

สร้าง Optimize pages (`/optimize` และ `/optimize/history`) — สำหรับบันทึก, เปรียบเทียบ, และวัดผล algorithm config หลายๆ รูปแบบ

---

## Context

- เพิ่ม pages ใน apps/web ที่สร้างจาก stage-4 และ stage-6
- ข้อมูลมาจาก `GET /api/optimize` และ `POST /api/optimize`
- core feature: เปรียบเทียบ config snapshots แบบ side-by-side
- ต้องมี back button ทั้งสอง page

---

## Deliverables

### 1. Optimize Page (app/optimize/page.tsx)

**URL:** `/optimize`

**ฟีเจอร์:**
- แสดงรายการ config snapshots ทั้งหมด (เรียงล่าสุดก่อน)
- สำหรับแต่ละ snapshot แสดง: version, label, วันที่สร้าง, win rate, total profit, max drawdown
- ปุ่ม "Save Current Config" — POST /api/optimize ด้วย params จาก settings + result จาก dashboard
- Back button
- Link ไป `/optimize/history`

**ตาราง snapshots:**

| คอลัมน์ | ข้อมูล |
|---------|-------|
| Version | v1, v2, ... |
| Label | ชื่อที่ตั้ง (optional) |
| Win Rate | % |
| Total Profit | กำไรรวม |
| Max Drawdown | % |
| Saved At | วันเวลา |

### 2. Optimize History Page (app/optimize/history/page.tsx)

**URL:** `/optimize/history`

**ฟีเจอร์:**
- แสดงรายการ snapshots ทั้งหมดพร้อมรายละเอียด params
- Diff view — เปรียบเทียบ params ระหว่าง 2 versions ที่เลือก
- แสดง params ที่เปลี่ยนแปลงชัดเจน (highlight)
- Back button

**Diff UI:**

```
Version 3 vs Version 2
─────────────────────────────────
stopLoss       50  →  45    (changed)
takeProfit    100  →  100   (same)
lotSize       0.1  →  0.05  (changed)
```

### 3. TanStack Query Hooks (hooks/useOptimize.ts)

```ts
// GET all snapshots
export function useOptimizeSnapshots() {
  return useQuery({
    queryKey: ['optimize'],
    queryFn: () => apiFetch('/api/optimize').then(r => r.json()),
  })
}

// POST new snapshot
export function useSaveSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { params: Record<string, unknown>, result: SnapshotResult, label?: string }) =>
      apiFetch('/api/optimize', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimize'] })
    },
  })
}
```

### 4. Compare Selector

- checkbox หรือ radio สำหรับเลือก 2 versions ที่ต้องการเปรียบเทียบ
- แสดง diff เมื่อเลือกครบ 2 versions

---

## Acceptance Criteria

- [ ] `/optimize` แสดง snapshot list จาก API
- [ ] "Save Current Config" บันทึก snapshot ได้ (POST /api/optimize)
- [ ] `/optimize/history` แสดงประวัติพร้อม params ครบ
- [ ] Diff view เปรียบเทียบ 2 versions ได้
- [ ] Back button ทั้งสอง page ทำงานด้วย `router.back()`
- [ ] ไม่มี `<a href>` หรือ emoji ใน UI

---

## Rules

- ทุก API call ผ่าน `apiFetch`
- back button ใช้ `router.back()`
- ห้ามใช้ emoji — inline SVG เท่านั้น
- internal navigation ระหว่าง `/optimize` และ `/optimize/history` ใช้ `<Link>` เท่านั้น

---

## Gate-Out

เมื่อเสร็จแล้ว สร้าง `agentic/gate-out/stage-7-web-optimize.md` และ STOP
