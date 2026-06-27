---
status: ACTIVE
owner: CONDUCTOR
last_updated: 2026-06-27
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

Greenfield — เพิ่งเริ่ม setup governance files เสร็จ พร้อมเริ่ม stage-1-setup

---

## Milestone Backlog

| ID | Name | Goal | Status |
|----|------|------|--------|
| M-001 | Project Setup | Monorepo, tooling, CI pipeline | PLANNING |
| M-002 | Auth + API Core | Backend ready, all endpoints live | PLANNING |
| M-003 | Web Dashboard | Dashboard, Log, Settings pages live | PLANNING |
| M-004 | Optimize Feature | Optimize + History pages live | PLANNING |
| M-005 | MT5 Bridge | Live connection with MetaTrader 5 | PLANNING |

**Status values:** PLANNING · APPROVED · IN_PROGRESS · COMPLETE · CANCELLED

---

## Next Steps

เริ่ม stage-1-setup — ตั้งค่า pnpm workspace, Biome, TypeScript, Vitest, Playwright, และ wrangler.toml

---

## Success Metrics

The project will be considered successful when:
- [ ] Bot เทรดได้อัตโนมัติจาก algorithm ที่ dev กำหนด
- [ ] Dashboard แสดง P&L และ trade history ได้แบบ real-time
- [ ] Dev สามารถเปรียบเทียบ algorithm config และวัดผลได้อย่างเป็นระบบ

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
