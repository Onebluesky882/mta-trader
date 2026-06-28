// Generated from agentic/ROADMAP.md — update both files together when roadmap changes

export const ROADMAP_VISION = 'สร้าง Forex trading bot ที่รัน algorithm อัตโนมัติบน MT5 พร้อม web dashboard สำหรับ monitor, configure, และวัดผล — เพื่อให้ dev สามารถทดลองและปรับปรุง strategy ได้อย่างมีระบบ'

export const ROADMAP_PROGRESS = `ระบบทั้งหมดขึ้น production แล้ว — API deploy บน Cloudflare Workers, Web deploy บน Cloudflare Workers (opennextjs) พร้อมใช้งาน

สิ่งที่เสร็จแล้ว:
- ระบบ Login / Register พร้อม JWT Bearer token
- Dashboard แสดง P&L, Win Rate, สถานะ Bot แบบ real-time
- Trade Log บันทึกและกรองประวัติการเทรดได้
- Settings ปรับ parameter ของ algorithm ได้ (symbol, direction, maxTrades, lotSize, SL, TP)
- Optimize + History เปรียบเทียบ algorithm config แบบ side-by-side
- MT5 Bridge รับ trade-open, trade-close, heartbeat จาก MetaTrader 5 ผ่าน webhook
- Telegram Bot แจ้งเตือนสถานะและสรุปผลการเทรดผ่าน /status /trades /today /help`

export const ROADMAP_NEXT_STEPS = `- ติดตั้ง MT5 EA v2.0 บน MetaTrader 5 จริง (ไฟล์ docs/mt5-ea-template.mq5)
- ตั้งค่า TELEGRAM_CHAT_ID ใน Cloudflare secrets
- ทดสอบครบ 1 รอบ Open → TP/SL → Close → รายงานผล
- บันทึก algorithm snapshot แรกใน Optimize page`

export const ROADMAP_MILESTONES = [
  { id: 'M-001', name: 'Project Setup',       goal: 'ตั้งค่า monorepo, pnpm, TypeScript, Vitest, wrangler',              status: 'COMPLETE'    },
  { id: 'M-002', name: 'Auth + API Core',     goal: 'ระบบ login/register, JWT, Hono API, D1 database',                   status: 'COMPLETE'    },
  { id: 'M-003', name: 'Web Dashboard',       goal: 'หน้า Dashboard, Trade Log, Settings พร้อม deploy',                  status: 'COMPLETE'    },
  { id: 'M-004', name: 'Optimize Feature',    goal: 'หน้า Optimize + History เปรียบเทียบ config versions',               status: 'COMPLETE'    },
  { id: 'M-005', name: 'MT5 Bridge',          goal: 'รับ webhook จาก MetaTrader 5 และ sync trade status',                status: 'COMPLETE'    },
  { id: 'M-006', name: 'Telegram Bot',        goal: 'แจ้งเตือนสถานะ bot และผลเทรดผ่าน Telegram',                         status: 'COMPLETE'    },
  { id: 'M-007', name: 'Production Deploy',   goal: 'API + Web deploy บน Cloudflare, session persist ถูกต้อง',           status: 'COMPLETE'    },
  { id: 'M-008', name: 'Bot Trading Round',   goal: 'EA อ่าน settings, เปิด/ปิด position ครบรอบ, แจ้ง Telegram',        status: 'IN_PROGRESS' },
  { id: 'M-009', name: 'Algorithm Tuning',    goal: 'บันทึก snapshot หลังครบรอบ, เปรียบเทียบ performance versions',       status: 'PLANNING'    },
]
