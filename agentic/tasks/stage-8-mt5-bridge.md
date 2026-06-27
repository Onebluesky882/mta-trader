# Dispatch-In: stage-8-mt5-bridge

**Stage ID:** stage-8-mt5-bridge
**Domain:** apps/api
**Branch:** stage-8-mt5-bridge
**Gate-In Verified:** NO

---

## Mission

สร้าง MT5 Bridge layer ใน apps/api — รับ signal จาก MetaTrader 5 ผ่าน webhook และ sync trade status กลับเข้า D1 database

---

## Context

- MT5 (MetaTrader 5) รัน MQL5 Expert Advisor (EA) ที่ส่ง HTTP request มาหา API
- API รับ event จาก MT5 และ store ใน D1
- stage นี้ **ไม่ใช่** AI/ML — เป็นแค่ data ingestion layer
- Bridge อยู่ใน `apps/api` domain เท่านั้น — ไม่แตะ apps/web

---

## Deliverables

### 1. MT5 Webhook Route (apps/api/src/routes/mt5.ts)

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/mt5/trade-open` | MT5 เปิด trade ใหม่ |
| POST | `/api/mt5/trade-close` | MT5 ปิด trade |
| POST | `/api/mt5/heartbeat` | MT5 แจ้งว่า bot ยัง alive |

**Authentication:** ใช้ `MT5_WEBHOOK_SECRET` header (`X-MT5-Secret`) — ไม่ใช้ Bearer token (เพราะ MQL5 ไม่มี auth library)

```ts
// verify MT5 request
const secret = c.req.header('X-MT5-Secret')
if (secret !== env.MT5_WEBHOOK_SECRET) {
  return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
}
```

### 2. POST /api/mt5/trade-open

Input:
```ts
{
  ticket: number          // MT5 ticket number (ใช้เป็น trade id)
  symbol: string          // e.g. "EURUSD"
  direction: "BUY" | "SELL"
  openPrice: number
  volume: number
  openTime: string        // ISO 8601
}
```

Action: INSERT trade ใน D1 (`status = 'OPEN'`)

Output:
```ts
{ success: true, id: string }
```

### 3. POST /api/mt5/trade-close

Input:
```ts
{
  ticket: number
  closePrice: number
  closeTime: string       // ISO 8601
  profit: number
}
```

Action: UPDATE trade ใน D1 (`status = 'CLOSED'`, ใส่ close_price, close_time, profit)

Output:
```ts
{ success: true }
```

Error ถ้าหา ticket ไม่เจอ:
```ts
{ error: 'Trade not found', code: 'NOT_FOUND' }  // 404
```

### 4. POST /api/mt5/heartbeat

Input:
```ts
{ status: "RUNNING" | "STOPPED" | "ERROR", timestamp: string }
```

Action: upsert ใน `bot_status` table (สร้าง table ใหม่)

```sql
CREATE TABLE IF NOT EXISTS bot_status (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  status TEXT NOT NULL,
  last_seen TEXT NOT NULL
);
```

Dashboard `GET /api/dashboard` อ่าน `botStatus` จาก table นี้

Output:
```ts
{ success: true }
```

### 5. อัปเดต Dashboard Route

เพิ่มใน `apps/api/src/routes/dashboard.ts`:
- query `bot_status` table สำหรับ `botStatus` field
- ถ้าไม่มี record หรือ `last_seen` เก่ากว่า 5 นาที → `botStatus = 'STOPPED'`

### 6. MQL5 EA Template (docs/mt5-ea-template.mq5)

สร้าง sample MQL5 EA code ที่ dev ใช้เป็น reference — ไม่ใช่ production code:

```mq5
// template สำหรับ send webhook ไปหา API
// Dev ต้อง compile และ install ใน MT5 เอง
string api_url = "https://your-api.workers.dev";
string mt5_secret = "your-secret-here";  // ใส่ตรงนี้ใน MT5

// ส่ง trade-open event
void SendTradeOpen(int ticket, string symbol, string direction,
                  double openPrice, double volume, datetime openTime) {
  // HTTP POST ไปที่ /api/mt5/trade-open
  // ใส่ X-MT5-Secret header
}
```

เก็บไว้ที่ `docs/mt5-ea-template.mq5`

### 7. Unit Tests

`apps/api/src/routes/mt5.test.ts`:
- test trade-open สำเร็จ → trade ใน D1
- test trade-close สำเร็จ → trade updated
- test trade-close กับ ticket ที่ไม่มี → 404
- test ไม่มี X-MT5-Secret → 401
- test heartbeat → bot_status updated

---

## Acceptance Criteria

- [ ] `POST /api/mt5/trade-open` insert trade ใน D1 ได้
- [ ] `POST /api/mt5/trade-close` update trade status ได้
- [ ] `POST /api/mt5/heartbeat` update bot_status ได้
- [ ] Dashboard `botStatus` อ่านจาก bot_status table
- [ ] ทุก route return 401 ถ้าไม่มี/ผิด `X-MT5-Secret`
- [ ] unit tests ผ่านทั้งหมด
- [ ] `docs/mt5-ea-template.mq5` มีอยู่และ comment ชัดเจน
- [ ] `MT5_WEBHOOK_SECRET` ใช้ `wrangler secret put` — ไม่ hardcode

---

## Rules

- `MT5_WEBHOOK_SECRET` ต้อง set ด้วย `wrangler secret put MT5_WEBHOOK_SECRET`
- ห้าม hardcode secret ใด ๆ
- ห้าม expose route นี้โดยไม่มี authentication
- ห้าม modify governance files ใน `agentic/`

---

## Gate-Out

เมื่อเสร็จแล้ว สร้าง `agentic/gate-out/stage-8-mt5-bridge.md` และ STOP
