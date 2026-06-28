# PIPELINE.md

Status: ACTIVE
Owner: CONDUCTOR
Conductor Branch: main
Last Updated: 2026-06-28

---

## Stage Overview

| Stage | Domain | Depends On | Status |
|-------|--------|------------|--------|
| stage-1-setup | root | none | DONE |
| stage-2-auth | packages/auth | stage-1-setup | DONE |
| stage-3-api-core | apps/api | stage-2-auth | DONE |
| stage-4-web-dashboard | apps/web | stage-3-api-core | DONE |
| stage-5-web-log | apps/web | stage-4-web-dashboard | DONE |
| stage-6-web-settings | apps/web | stage-4-web-dashboard | DONE |
| stage-7-web-optimize | apps/web | stage-6-web-settings | DONE |
| stage-8-mt5-bridge | apps/api | stage-3-api-core | DONE |
| stage-9-telegram-bot | apps/api | stage-8-mt5-bridge | DONE |
| stage-10-production | apps/api + apps/web | all | DONE |
| stage-11-bot-trading | apps/api + MT5 EA | stage-10-production | IN_PROGRESS |
| stage-12-auto-snapshot | apps/api | stage-11-bot-trading | DONE |
| stage-13-compare-versions | apps/web | stage-12-auto-snapshot | DONE |

---

## Stage Detail

### stage-1-setup — DONE
**Domain:** root | **Status:** `DONE`
- pnpm workspace, Biome, TypeScript, Vitest, wrangler.toml ✓

### stage-2-auth — DONE
**Domain:** packages/auth | **Status:** `DONE`
- Bearer JWT, login/register endpoints, auth middleware ✓

### stage-3-api-core — DONE
**Domain:** apps/api | **Status:** `DONE`
- Hono on Cloudflare Workers, D1 schema, all routes, unit tests ✓

### stage-4-web-dashboard — DONE
**Domain:** apps/web | **Status:** `DONE`
- Dashboard แสดง P&L, Win Rate, Bot Status, Open Trades ✓
- TanStack Query, Zustand persist, Bearer token ✓

### stage-5-web-log — DONE
**Domain:** apps/web | **Status:** `DONE`
- Trade Log `/log` — pagination, date filter, skeleton loader ✓

### stage-6-web-settings — DONE
**Domain:** apps/web | **Status:** `DONE`
- Settings `/settings` — แก้ algorithm params, save version ✓
- Params: symbol, direction, maxTrades, lotSize, stopLoss, takeProfit, RSI, MACD ✓

### stage-7-web-optimize — DONE
**Domain:** apps/web | **Status:** `DONE`
- Optimize `/optimize` — บันทึก config snapshot ✓
- History `/optimize/history` — diff เปรียบเทียบ 2 versions ✓

### stage-8-mt5-bridge — DONE
**Domain:** apps/api | **Status:** `DONE`
- `POST /api/mt5/trade-open` — รับ trade เปิดจาก EA ✓
- `POST /api/mt5/trade-close` — รับ trade ปิดพร้อม P&L ✓
- `POST /api/mt5/heartbeat` — bot alive check ✓
- `GET /api/settings/active` — EA อ่าน settings ด้วย X-MT5-Secret ✓

### stage-9-telegram-bot — DONE
**Domain:** apps/api | **Status:** `DONE`
- `/status` `/trades` `/today` `/help` commands ✓
- แจ้งเตือน trade-open, trade-close (TP/SL), bot stopped ✓
- Webhook: `POST /webhook/telegram` ✓

### stage-10-production — DONE
**Domain:** apps/api + apps/web | **Status:** `DONE`
- API: `atp-bot-trader-api.onebluesky882.workers.dev` ✓
- Web: `all-tp-bot-web.onebluesky882.workers.dev` ✓
- Session persist (Zustand localStorage) ✓
- CORS, auth guard, owner-only pages ✓

---

### stage-11-bot-trading — IN_PROGRESS

**Domain:** apps/api + MT5 EA
**Depends On:** stage-10-production
**Status:** `IN_PROGRESS`

**เป้าหมาย:** Bot เทรดครบ 1 รอบ (Open → SL/TP → Close) ตาม settings และแจ้งผลผ่าน Telegram

**Acceptance Criteria:**
- [ ] ติดตั้ง EA v2.0 บน MetaTrader 5 จริง
- [ ] EA อ่าน settings จาก `/api/settings/active` ทุก 5 นาที
- [ ] EA เปิด position ตาม `maxTrades`, `direction`, `lotSize`, `stopLoss`, `takeProfit`
- [ ] เมื่อ TP/SL hit → EA ส่ง trade-close พร้อม reason และ profit
- [ ] Telegram แจ้งเตือน: trade-open, trade-close (TP/SL), P&L
- [ ] Dashboard แสดง P&L และ trade log อัปเดตถูกต้อง
- [ ] `TELEGRAM_CHAT_ID` set ใน Cloudflare secrets

**สิ่งที่ต้องทำ:**
1. `wrangler secret put TELEGRAM_CHAT_ID` (Chat ID จาก Telegram)
2. Copy `docs/mt5-ea-template.mq5` → MT5 Experts folder
3. Compile + Attach to chart
4. ตั้งค่า settings ใน Web `/settings`
5. ทดสอบ: เปิด 1 trade ดู Telegram และ Dashboard

---

### stage-12-auto-snapshot — DONE

**Domain:** apps/api
**Depends On:** stage-11-bot-trading
**Status:** `DONE`

**เป้าหมาย:** หลัง bot เทรดครบ N รอบ (N = `maxTrades`) → บันทึก optimize snapshot อัตโนมัติ + แจ้ง Telegram

**Acceptance Criteria:**
- [x] `trade-close` เรียก `tryAutoSnapshot()` ทุกครั้ง
- [x] นับ CLOSED trades % `maxTrades` === 0 → trigger snapshot
- [x] snapshot บันทึก params (settings version) + P&L stats (winRate, totalProfit, maxDrawdown)
- [x] label = `Auto — v{settingsVersion} · {N} trades`
- [x] Telegram แจ้งเตือน: Trade count, Win Rate, Total P&L, Max Drawdown
- [x] ถ้า fail → ไม่กระทบ trade-close response (try/catch)

---

### stage-13-compare-versions — DONE

**Domain:** apps/web
**Depends On:** stage-12-auto-snapshot
**Status:** `DONE`

**เป้าหมาย:** เปรียบเทียบ algorithm config versions แบบ side-by-side พร้อมผลลัพธ์

**Acceptance Criteria:**
- [x] `/optimize` แสดง version cards พร้อม Best badge, P&L bar, params chips
- [x] `/optimize/history` แสดง table — Win Rate, Profit, **Drawdown**, Date
- [x] เลือก 2 versions → DiffView เปรียบเทียบ params ที่เปลี่ยน (highlight สีทอง→เขียว)
- [x] Auto-snapshot info note บน Optimize page
- [x] สี theme ตรงกับ neon green design system

---

## Deploy Checklist

```bash
# API
pnpm type-check
wrangler deploy   # จาก apps/api

# Web
pnpm run deploy   # จาก apps/web
```

## Secrets Required

```bash
cd apps/api
wrangler secret put MT5_WEBHOOK_SECRET    # ตรงกับ EA MT5_SECRET
wrangler secret put BOT_TOKEN             # จาก @BotFather
wrangler secret put TELEGRAM_SECRET_TOKEN # สำหรับ webhook verify
wrangler secret put TELEGRAM_CHAT_ID      # Chat ID ของคุณ (ดูจาก @userinfobot)
```
