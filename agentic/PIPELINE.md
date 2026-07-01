# PIPELINE.md

Status: ACTIVE
Owner: CONDUCTOR
Conductor Branch: main
Last Updated: 2026-07-01

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
| stage-14-ai-signal | apps/api + apps/web | stage-10-production | DONE |
| stage-15-architecture-pivot | apps/api + MT5 EA | stage-14-ai-signal | DONE |
| stage-16-strategy-engine | apps/api + apps/web + MT5 EA | stage-15-architecture-pivot | CODE_COMPLETE |

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

### stage-14-ai-signal — DONE

**Domain:** apps/api + apps/web
**Depends On:** stage-10-production
**Status:** `DONE`

**เป้าหมาย:** ให้ AI วิเคราะห์ H4/H1 indicators แล้วออก BUY/SELL/HOLD signal พร้อม SL/TP ก่อน EA เปิด order จริง

**Acceptance Criteria:**
- [x] `POST /api/ai-signal/analyze` — รับ candle/indicator data, เรียก AI, คืน signal+confidence+reason+SL/TP
- [x] `GET /api/ai-signal/latest`, `/history` — อ่าน signal ที่บันทึกไว้
- [x] `GET/PUT /api/ai-config` — ตั้งค่า `aiEnabled`, `confidenceMin`, `rrMin`; EA อ่านผ่าน `/api/ai-config/active`
- [x] หน้าเว็บ `/ai-config` — CRUD ผ่าน UI
- [x] EA: `AiApproves()` เรียก AI ก่อนทุก trade เมื่อ `aiEnabled = true`, skip ถ้า confidence ต่ำกว่า threshold
- [x] Neon green design system (theme ปัจจุบันของทั้งเว็บ) มาจาก stage นี้

---

### stage-15-architecture-pivot — DONE

**Domain:** apps/api + MT5 EA
**Depends On:** stage-14-ai-signal
**Status:** `DONE`

**เป้าหมาย:** ทดลอง multi-user data isolation แล้วตัดสินใจย้อนกลับเป็น single-user private app เพราะไม่จำเป็นต้องรองรับหลายบัญชี

**สิ่งที่เกิดขึ้น (ทั้งสองทิศทางอยู่ใน stage เดียวเพราะ revert เกิดวันเดียวกัน):**
- [x] (ลอง) เพิ่ม `user_id` filter ทุก route + `user_api_keys` table + `/account` page สำหรับ personal MT5 API key ต่อ user
- [x] (ตัดสินใจย้อนกลับ) เอา per-user filtering ออก — ทุก route กลับไปใช้ singleton pattern (`id = 'singleton'`) ยกเว้น `trades` ที่ไม่ filter อะไรเลย
- [x] MT5 auth กลับไปใช้ `MT5_WEBHOOK_SECRET` ตัวเดียว (shared secret) แทน per-user API key
- [x] เปลี่ยน AI provider จาก Claude เป็น Groq (`llama-3.3-70b-versatile`, free tier)
- [x] EA อัปเดตเป็น v3.0 — เรียก AI ก่อนทุก trade

**หมายเหตุสำคัญสำหรับ worker ในอนาคต:**
- `users` table (จาก stage-2, custom JWT auth) **ไม่มีโค้ดส่วนไหนอ่าน/เขียนแล้ว** — auth จริงทั้งหมดใช้ better-auth (`user`/`session`/`account`/`verification` tables ผ่าน `packages/auth`) `c.get('user').id` มาจากตาราง `user` เท่านั้น
- `apps/api/src/routes/account.ts` ยังอยู่ในโค้ดแต่**ไม่ได้ register ใน `index.ts`** — dead code ค้างจาก revert นี้ ยังไม่ได้ลบ
- `user_id` column ยังอยู่ในหลายตาราง (`trades`, `algorithm_settings`, ฯลฯ) แต่ query logic ไม่ filter ตามนี้แล้ว — เป็น column เดิมที่เหลือค้าง ไม่ใช่ bug

---

### stage-16-strategy-engine — CODE_COMPLETE

**Domain:** apps/api + apps/web + MT5 EA
**Depends On:** stage-15-architecture-pivot
**Status:** `CODE_COMPLETE` (ยังไม่ผ่าน live MT5 field test — ดู stage-11)

**เป้าหมาย:** ให้ client พิมพ์กลยุทธ์เป็น text ธรรมดา (เช่น "H1 demand zone, lower wick แตะกัน 5 แท่ง → BUY") แล้ว AI แปลงเป็น config ครั้งเดียว จากนั้น EA คำนวณ zone จริงจาก candle history เองทุก tick โดยไม่ต้องเรียก AI ต่อ trade (ประหยัด latency/cost) พร้อม track ผลกำไร/ขาดทุนแยกตามกลยุทธ์

**หมายเหตุสถาปัตยกรรม:** `strategy_config` **มี per-user scoping จริง** (FK ไป `user(id)`) ต่างจาก stage-15 ที่เป็น singleton pattern ทั้งหมด — เป็นการตัดสินใจเฉพาะจุดตามคำขอ owner (เผื่อ client/Expo app/Telegram bot ในอนาคตที่อาจมีมากกว่า 1 บัญชีมาแชร์ backend เดียวกัน)

**Acceptance Criteria:**
- [x] DB: `strategy_config` table (FK → `user`, ไม่ใช่ `users` ตัวเก่า) + `trades.strategy_id` (FK → `strategy_config`)
- [x] `schema.sql` เป็น idempotent ทั้งไฟล์ — ALTER TABLE (ไม่ idempotent โดยธรรมชาติ) แยกไปอยู่ `migrations/0001_trades_add_strategy_id.sql`
- [x] API: `POST/GET /api/strategy`, `PUT /:id/activate`, `GET /:id/performance` (win rate, P&L), `GET /api/strategy/active` (EA polls ด้วย `X-MT5-Secret`)
- [x] EA: `FindWickClusterZone()` (cluster candle Low/High จาก H1 จริงตาม `minWickTouches`/`proximityPoints`), `CheckStrategyEntry()`, `OpenStrategyPosition()` (fixed TP/SL points, tag order ด้วย `STRAT:<id>` สั้นเพราะ broker มักตัด comment ที่ ~31 ตัวอักษร)
- [x] `mt5.ts` รับ `strategyId` จาก EA บันทึกลง `trades.strategy_id` เพื่อให้ performance tracking ทำงานจริง
- [x] เว็บ `/strategy` — ฟอร์มกรอกกลยุทธ์ + list พร้อม Activate + performance panel แบบ expand
- [x] Unit tests: `strategy.test.ts` 17 เทสต์ + แก้บั๊กเดิมที่ไม่เกี่ยวข้อง (`trades.ts` NaN validation, `mt5.test.ts` mock ไม่ครบ) — รวม 64/64 ผ่าน
- [x] Typecheck ผ่านทั้ง `apps/api`, `apps/web`, `apps/admin`
- [x] Verify ด้วย Playwright จริง (screenshot `/strategy` หลัง inject fake auth token) — เห็น form/nav/list render ถูกต้อง
- [x] Migration รันแล้วทั้ง local D1 และ **remote D1 (production)** — ตรวจสอบ table/FK/index ครบ
- [ ] ยังไม่ได้ทดสอบ entry จริงบน MT5 ของจริง (ต้องรอ EA ติดตั้งบนเครื่องจริงตาม stage-11 ก่อน ถึงจะเห็น zone-detection ทำงานกับราคาสด)

---

## Deploy Checklist

```bash
# API
pnpm type-check
wrangler deploy   # จาก apps/api

# Web
pnpm run deploy   # จาก apps/web
```

## Migrations Required (ก่อน deploy ครั้งแรกหลัง stage-16)

```bash
cd apps/api
# ลำดับสำคัญ: รัน migration ก่อน แล้วค่อยรัน schema.sql
# (schema.sql index บน trades.strategy_id ต้องมี column นี้อยู่ก่อนแล้ว)
wrangler d1 execute DB --remote --file=src/db/migrations/0001_trades_add_strategy_id.sql
wrangler d1 execute DB --remote --file=src/db/schema.sql
```

## Secrets Required

```bash
cd apps/api
wrangler secret put MT5_WEBHOOK_SECRET    # ตรงกับ EA MT5_SECRET
wrangler secret put BOT_TOKEN             # จาก @BotFather
wrangler secret put TELEGRAM_SECRET_TOKEN # สำหรับ webhook verify
wrangler secret put TELEGRAM_CHAT_ID      # Chat ID ของคุณ (ดูจาก @userinfobot)
```
