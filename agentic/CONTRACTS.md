# CONTRACTS.md

## Purpose

กำหนด public interface ระหว่าง modules — workers ต้องปฏิบัติตาม contract นี้เสมอ ห้าม deviate โดยไม่ได้รับ Conductor approval

⸻

## Module: Trade Log API

**Route:** `GET /api/trades`

### Input
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | No | หน้าที่ต้องการ (default: 1) |
| `limit` | number | No | จำนวน record ต่อหน้า (default: 50) |
| `from` | string (ISO date) | No | กรองจากวันที่ |
| `to` | string (ISO date) | No | กรองถึงวันที่ |

### Output
```ts
{
  trades: {
    id: string
    symbol: string        // e.g. "EURUSD"
    direction: "BUY" | "SELL"
    openPrice: number
    closePrice: number | null
    openTime: string      // ISO 8601
    closeTime: string | null
    profit: number | null
    volume: number
    status: "OPEN" | "CLOSED"
  }[]
  total: number
  page: number
  limit: number
}
```

### Errors
```ts
{ error: string, code: "UNAUTHORIZED" | "INVALID_PARAMS" | "INTERNAL_ERROR" }
```

⸻

## Module: Algorithm Settings API

**Routes:**
- `GET /api/settings` — ดึง config ปัจจุบัน
- `PUT /api/settings` — อัปเดต config

### Input (PUT)
```ts
{
  params: Record<string, number | string | boolean>  // algorithm parameters
}
```

### Output (GET & PUT)
```ts
{
  id: string
  version: number
  params: Record<string, number | string | boolean>
  updatedAt: string  // ISO 8601
}
```

### Errors
```ts
{ error: string, code: "UNAUTHORIZED" | "VALIDATION_ERROR" | "INTERNAL_ERROR" }
```

⸻

## Module: Optimize History API

**Routes:**
- `GET /api/optimize` — ดึงรายการ config versions ทั้งหมด
- `POST /api/optimize` — บันทึก config snapshot พร้อม result

### Input (POST)
```ts
{
  params: Record<string, number | string | boolean>
  result: {
    totalTrades: number
    winRate: number       // 0–1
    totalProfit: number
    maxDrawdown: number
    sharpeRatio: number | null
  }
  label?: string          // optional description
}
```

### Output (GET)
```ts
{
  snapshots: {
    id: string
    version: number
    params: Record<string, number | string | boolean>
    result: {
      totalTrades: number
      winRate: number
      totalProfit: number
      maxDrawdown: number
      sharpeRatio: number | null
    }
    label: string | null
    createdAt: string
  }[]
}
```

### Errors
```ts
{ error: string, code: "UNAUTHORIZED" | "VALIDATION_ERROR" | "INTERNAL_ERROR" }
```

⸻

## Module: Dashboard Stats API

**Route:** `GET /api/dashboard`

### Output
```ts
{
  botStatus: "RUNNING" | "STOPPED" | "ERROR"
  openTrades: number
  todayPnL: number
  totalPnL: number
  winRate: number   // 0–1
  lastUpdated: string  // ISO 8601
}
```

### Errors
```ts
{ error: string, code: "UNAUTHORIZED" | "INTERNAL_ERROR" }
```

⸻

## Module: Auth

**Route:** `POST /api/auth/login`

### Input
```ts
{ email: string, password: string }
```

### Output
```ts
{ token: string, expiresAt: string }
```

### Errors
```ts
{ error: string, code: "INVALID_CREDENTIALS" | "INTERNAL_ERROR" }
```

Authorization header format (all protected routes):
```
Authorization: Bearer <token>
```

⸻
