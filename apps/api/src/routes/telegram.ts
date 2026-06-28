import { Hono } from 'hono'
import { createD1Client } from '../db/client'

type Bindings = {
  DB: D1Database
  BOT_TOKEN: string
  TELEGRAM_SECRET_TOKEN: string  // set in setWebhook ?secret_token=
}

// Telegram update types (minimal)
interface TelegramUpdate {
  message?: {
    chat: { id: number }
    from?: { first_name?: string }
    text?: string
  }
}

const telegramRouter = new Hono<{ Bindings: Bindings }>()

// ── Auth — Telegram sends X-Telegram-Bot-Api-Secret-Token ─────

telegramRouter.post('/telegram', async (c) => {
  const incoming = c.req.header('X-Telegram-Bot-Api-Secret-Token')
  if (!incoming || incoming !== c.env.TELEGRAM_SECRET_TOKEN) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  let update: TelegramUpdate
  try {
    update = await c.req.json()
  } catch {
    return c.json({ ok: false }, 400)
  }

  const msg = update.message
  if (!msg?.text || !msg.chat?.id) return c.json({ ok: true })

  const chatId = msg.chat.id
  const text = msg.text.trim()
  const d1 = createD1Client(c.env.DB)

  // ── Command dispatch ────────────────────────────────────────

  if (text === '/start' || text === '/help') {
    await send(c.env.BOT_TOKEN, chatId,
      `*MTA Trader Bot* 🤖\n\n` +
      `Commands:\n` +
      `/status — สถานะ bot และ P\\&L\n` +
      `/trades — จำนวน trade ที่เปิดอยู่\n` +
      `/today — กำไร/ขาดทุนวันนี้\n` +
      `/help — แสดงคำสั่งทั้งหมด`
    )
    return c.json({ ok: true })
  }

  if (text === '/status') {
    const [botRow, openRow, totalsRow] = await Promise.all([
      d1.first<{ status: string; last_seen: string }>(
        "SELECT status, last_seen FROM bot_status WHERE id = 'singleton'"
      ),
      d1.first<{ count: number }>("SELECT COUNT(*) as count FROM trades WHERE status = 'OPEN'"),
      d1.first<{ totalPnL: number | null; totalClosed: number; wins: number }>(
        `SELECT SUM(profit) as totalPnL, COUNT(*) as totalClosed,
         SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins
         FROM trades WHERE status = 'CLOSED'`
      ),
    ])

    const stale = botRow
      ? Date.now() - new Date(botRow.last_seen).getTime() > 5 * 60 * 1000
      : true
    const botStatus = botRow && !stale ? botRow.status : 'STOPPED'
    const statusIcon = botStatus === 'RUNNING' ? '🟢' : botStatus === 'ERROR' ? '🔴' : '⚫'

    const totalPnL = totalsRow?.totalPnL ?? 0
    const totalClosed = totalsRow?.totalClosed ?? 0
    const wins = totalsRow?.wins ?? 0
    const winRate = totalClosed > 0 ? ((wins / totalClosed) * 100).toFixed(1) : '0.0'
    const pnlSign = totalPnL >= 0 ? '+' : ''

    await send(c.env.BOT_TOKEN, chatId,
      `${statusIcon} *Bot:* ${botStatus}\n` +
      `📂 *Open trades:* ${openRow?.count ?? 0}\n` +
      `💰 *Total P&L:* ${pnlSign}${totalPnL.toFixed(2)}\n` +
      `🎯 *Win rate:* ${winRate}% (${totalClosed} trades)`
    )
    return c.json({ ok: true })
  }

  if (text === '/trades') {
    const rows = await d1.query<{
      symbol: string; direction: string; open_price: number; volume: number; open_time: string
    }>(`SELECT symbol, direction, open_price, volume, open_time
        FROM trades WHERE status = 'OPEN' ORDER BY open_time DESC LIMIT 10`)

    if (rows.length === 0) {
      await send(c.env.BOT_TOKEN, chatId, '📭 ไม่มี trade ที่เปิดอยู่ขณะนี้')
    } else {
      const lines = rows.map((r, i) =>
        `${i + 1}\\. *${r.symbol}* ${r.direction} @ ${r.open_price.toFixed(5)} (vol ${r.volume})`
      )
      await send(c.env.BOT_TOKEN, chatId,
        `📂 *Open Trades (${rows.length})*\n\n` + lines.join('\n')
      )
    }
    return c.json({ ok: true })
  }

  if (text === '/today') {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const row = await d1.first<{ pnl: number | null; count: number }>(
      `SELECT SUM(profit) as pnl, COUNT(*) as count
       FROM trades WHERE status = 'CLOSED' AND close_time >= ?`,
      [todayStart.toISOString().slice(0, 10)]
    )

    const pnl = row?.pnl ?? 0
    const pnlSign = pnl >= 0 ? '+' : ''
    const icon = pnl >= 0 ? '📈' : '📉'

    await send(c.env.BOT_TOKEN, chatId,
      `${icon} *Today P&L:* ${pnlSign}${pnl.toFixed(2)}\n` +
      `📋 *Closed today:* ${row?.count ?? 0} trades`
    )
    return c.json({ ok: true })
  }

  // Unknown command — echo back
  await send(c.env.BOT_TOKEN, chatId,
    `ไม่รู้จักคำสั่ง "${escMd(text)}"\n\nพิมพ์ /help เพื่อดูคำสั่งทั้งหมด`
  )
  return c.json({ ok: true })
})

// ── Helpers ───────────────────────────────────────────────────

async function send(token: string, chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

function escMd(s: string): string {
  return s.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1')
}

export { telegramRouter }
