---
status: ACTIVE
owner: CONDUCTOR
last_updated: 2026-07-02
---

# ROADMAP.md

> **Workers may read this document. Workers must NOT modify this document.**
> Implementation planning belongs in PIPELINE.md.

---

## Purpose

This document defines the long-term direction of the project.

Intended for: Product Owners, Project Managers, Architects, Developers, Future Contributors.

---

## Project Vision

สร้าง Forex trading bot ที่รัน algorithm อัตโนมัติบน MT5 พร้อม web dashboard สำหรับ monitor, configure, และวัดผล — เพื่อให้ dev สามารถทดลองและปรับปรุง strategy ได้อย่างมีระบบ

---

## Problem Statement

- การเทรด Forex ด้วยมือมีข้อจำกัดเรื่องเวลาและอารมณ์
- ยากต่อการเปรียบเทียบ algorithm config หลายๆ รูปแบบอย่างเป็นระบบ
- ไม่มี dashboard กลางสำหรับ monitor trade ที่รันอยู่และผลลัพธ์

---

## Business Goals

### Goal 1 — Automate Trading

Description: รัน algorithm เทรด Forex บน MT5 ได้อัตโนมัติ โดยไม่ต้องเฝ้าหน้าจอ

Success Criteria:
- [ ] Bot รับ signal จาก algorithm และส่ง order ไปยัง MT5 ได้
- [ ] Bot รันได้ต่อเนื่องโดยไม่ต้องมี manual intervention
- [ ] Trade log บันทึกทุก trade อัตโนมัติ

### Goal 2 — Optimize Strategy

Description: เปรียบเทียบ algorithm config หลายๆ รูปแบบ และวัดผลเพื่อ improve strategy

Success Criteria:
- [ ] บันทึก config snapshot พร้อม performance metrics ได้
- [ ] เปรียบเทียบ config versions แบบ side-by-side ได้
- [ ] ดู history การแก้ไข config พร้อมผลลัพธ์ได้

---

## Strategic Objectives

### Objective 1 — Web Dashboard

Description: Dashboard ที่ใช้งานง่าย สำหรับ monitor และ configure bot

Success Indicators:
- [ ] Dashboard แสดง real-time P&L และสถานะ bot
- [ ] Settings page แก้ไข algorithm parameters ได้
- [ ] Optimize page เปรียบเทียบ config และผลลัพธ์ได้

### Objective 2 — MT5 Integration

Description: เชื่อมต่อกับ MetaTrader 5 ผ่าน bridge layer ที่เชื่อถือได้

Success Indicators:
- [ ] รับ signal จาก MT5 ได้ผ่าน webhook หรือ Python bridge
- [ ] Trade status sync กับ MT5 อัตโนมัติ

---

## Current Progress

ระบบทั้งหมดขึ้น production แล้ว — API deploy บน Cloudflare Workers, Web deploy บน Cloudflare Workers (opennextjs) พร้อมใช้งาน

สิ่งที่เสร็จแล้ว:
- ระบบ Login / Register พร้อม JWT Bearer token
- Dashboard แสดง P&L, Win Rate, สถานะ Bot แบบ real-time
- Trade Log บันทึกและกรองประวัติการเทรดได้
- Settings ปรับ parameter ของ algorithm ได้
- Optimize + History เปรียบเทียบ algorithm config แบบ side-by-side
- MT5 Bridge รับ trade-open, trade-close, heartbeat จาก MetaTrader 5 ผ่าน webhook
- Telegram Bot แจ้งเตือนสถานะและสรุปผลการเทรดผ่าน /status /trades /today /help
- **Strategy Engine (ใหม่ — เสร็จและทดสอบผ่านจริงวันนี้ 2026-07-02):** พิมพ์อธิบายกลยุทธ์เป็นข้อความธรรมดา (ไทยหรืออังกฤษก็ได้) → AI แปลงเป็นค่าที่ EA เข้าใจ ครั้งเดียวจบ ไม่ต้องเรียก AI ซ้ำทุก tick → บอทหาโซนซื้อ-ขาย (demand/supply zone) เองจากราคาจริงหลายไทม์เฟรมพร้อมกันได้ (เช่น H4 + H1 + M30 ในกลยุทธ์เดียว) → ทดสอบเปิด order จริงสำเร็จบนบัญชีเดโม่ IUX แล้ว

---

## Milestone Backlog

| ID | Name | Goal | Status |
|----|------|------|--------|
| M-001 | Project Setup | ตั้งค่า monorepo, pnpm, TypeScript, Vitest, wrangler | COMPLETE |
| M-002 | Auth + API Core | ระบบ login/register, JWT, Hono API, D1 database | COMPLETE |
| M-003 | Web Dashboard | หน้า Dashboard, Trade Log, Settings พร้อม deploy | COMPLETE |
| M-004 | Optimize Feature | หน้า Optimize + History เปรียบเทียบ config versions | COMPLETE |
| M-005 | MT5 Bridge | รับ webhook จาก MetaTrader 5 และ sync trade status | COMPLETE |
| M-006 | Telegram Bot | แจ้งเตือนสถานะ bot และผลเทรดผ่าน Telegram | COMPLETE |
| M-007 | Production Deploy | API + Web deploy บน Cloudflare, session persist ถูกต้อง | COMPLETE |
| M-008 | Bot Trading Round | EA อ่าน settings, เปิด/ปิด position ครบรอบ, แจ้ง Telegram | IN_PROGRESS |
| M-009 | Algorithm Tuning | บันทึก snapshot หลังครบรอบ, เปรียบเทียบ performance versions | PLANNING |
| M-010 | Strategy Engine | พิมพ์กลยุทธ์เป็นข้อความ → AI แปลงเป็น config → บอทหาโซนเทรดเองจากราคาจริง หลายไทม์เฟรมพร้อมกันได้ | COMPLETE |
| M-011 | Multi-Symbol Trading | เทรดได้หลายสินทรัพย์พร้อมกัน (ทอง/น้ำมัน/BTC) โดยแต่ละตัวมีกลยุทธ์ของตัวเอง | PLANNING |
| M-012 | Telegram Command Control | สั่งเปิด-ปิดกลยุทธ์และรับแจ้งเตือนผลเทรดผ่าน Telegram ได้ทั้งหมด ไม่ต้องเปิดเว็บ | PLANNING |

**Status values:** PLANNING · APPROVED · IN_PROGRESS · COMPLETE · CANCELLED

---

## Next Steps

- เพิ่มการเทรดหลายสินทรัพย์พร้อมกัน (ทอง/น้ำมัน/BTC) — แต่ละตัวมีกลยุทธ์ TP/SL ของตัวเอง (M-011)
- ควบคุมบอทผ่าน Telegram ทั้งหมด — สั่งเปิด/ปิดกลยุทธ์ + รับแจ้งเตือนผลเทรด โดยไม่ต้องเปิดเว็บ (M-012)
- เพิ่มปุ่ม copy ตัวอย่างคำสั่งกลยุทธ์บนหน้าเว็บ ช่วยให้ตั้งกลยุทธ์ใหม่ได้เร็วขึ้นโดยไม่ต้องพิมพ์เอง
- บันทึก algorithm snapshot แรกใน Optimize page แล้วเปรียบเทียบผลลัพธ์ระหว่าง config versions

---

## Success Metrics

The project will be considered successful when:
- [x] Bot เทรดได้อัตโนมัติจาก algorithm ที่ dev กำหนด
- [x] Dashboard แสดง P&L และ trade history ได้แบบ real-time
- [x] Dev สามารถเปรียบเทียบ algorithm config และวัดผลได้อย่างเป็นระบบ
- [ ] Bot รันต่อเนื่อง 30 วันโดยไม่ต้อง restart manual

---

## Risks

### Risk 1

Description: MT5 bridge ต้องใช้ MQL5 หรือ Python ซึ่งอาจมี latency หรือ connectivity issues

Mitigation: ออกแบบ bridge เป็น separate stage (stage-8) หลังจาก core system พร้อมแล้ว — ลด dependency

---

## Guiding Principles

1. Human governance first
2. Contracts before implementation
3. Architecture before coding
4. Validation before merge
5. Integration before release
6. Explicit documentation over assumptions

---

## Project Scope

**In Scope:**
- MT5 Forex trading bot (algorithm ตาม dev)
- Web dashboard: Dashboard, Trade Log, Algorithm Settings, Optimize + History
- Cloudflare Workers API + D1 database
- MT5 bridge layer (MQL5 webhook หรือ Python)

**Out of Scope:**
- ระบบสำหรับ multi-user / หลายบัญชี (ช่วงแรก solo dev เท่านั้น)
- Social trading หรือ copy trading
- Algorithm backtesting engine (ใช้ MT5 strategy tester แทน)

---

## Governance

See `GOVERNANCE_CORE.md` for file ownership and the relationship between documents.

Changes to this roadmap require:
1. Conductor review
2. Rationale
3. Impact analysis
4. Documentation update

Workers may not modify ROADMAP.md. Dev may edit directly (see GOVERNANCE_CORE.md), logged in DEV_LOG.md.

---

## Final Statement

**ROADMAP.md** is the source of truth for project direction.

**PIPELINE.md** is the source of truth for project execution.

See `GOVERNANCE_CORE.md` for authority order.
