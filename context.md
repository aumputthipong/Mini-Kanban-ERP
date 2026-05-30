# Context — Turtask (Mini ERP Kanban)

เอกสารสรุปบริบทโปรเจกต์แบบหน้าเดียว สำหรับ orientation เร็ว ๆ. **ไม่ใช่** working agreement —
กฎการเขียนโค้ดอยู่ที่ [`AGENTS.md`](AGENTS.md) (อ่านก่อนเขียนโค้ดเสมอ).

## โปรเจกต์นี้คืออะไร

Turtask = real-time Kanban workspace สำหรับทีมเล็ก (mini ERP). ลากการ์ดข้าม column,
assign เพื่อนร่วมทีม, แล้ว board sync ทันทีผ่าน WebSocket. มี personal workspace
(My Work) ที่รวมงานข้ามทุก board.

## Stack

| ชั้น | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · @dnd-kit |
| Backend | Go 1.25 · chi · sqlc · pgx/v5 · Gorilla WebSocket · golang-migrate · JWT |
| Database | PostgreSQL 15 · UUID v4 keys · migrations รันอัตโนมัติตอน startup |
| Realtime | WebSocket hub (1 room ต่อ board) · optimistic UI ฝั่ง client |

## โครงสร้าง top-level

- `backend/` — Go service (layered: `handler/` → `service/` → `db/` sqlc-generated). Migrations + queries ใต้ `backend/database/`.
- `frontend/` — Next.js app. โค้ดอยู่ `frontend/src/` (`app/` routes, `components/`, `lib/`, `store/`, `types/`).
- `docs/` — ARCHITECTURE, DATABASE, DEPLOY.
- `loadtest/` — k6/load scripts.

## คำสั่งที่ใช้บ่อย (รันจากราก, ผ่าน `make`)

| ทำอะไร | คำสั่ง |
|--------|--------|
| Dev stack เต็ม (Postgres + backend + frontend) | `make dev` |
| รันทุกอย่างที่ CI รัน (vet + test + tsc + vitest) | `make verify` |
| Backend tests (`-race`, ข้าม integration) | `make test` |
| Integration tests (Postgres จริงผ่าน Docker) | `make test-integration` |
| Frontend unit tests (vitest) | `make test-fe` |
| Type check (`tsc --noEmit`) | `make typecheck` |
| Regenerate sqlc หลังแก้ query | `make sqlc` |
| Migration ใหม่ | `make migrate-new name=add_foo` |

> ก่อน push: `make verify` ต้องผ่าน. UI change → เปิด browser ทดสอบจริง + เช็ค `frontend/design.md`.

## แผนที่เอกสาร (อ่านตัวจริงที่ไหน)

- [`AGENTS.md`](AGENTS.md) / [`CLAUDE.md`](CLAUDE.md) — working agreement สำหรับ AI agents + นักพัฒนา (กฎ layered architecture, permissions, migrations, frontend rules, testing).
- [`README.md`](README.md) — quick start.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layered design, permission matrix, WS hub, ที่จงใจไม่ทำ.
- [`docs/DATABASE.md`](docs/DATABASE.md) — ERD, table notes, migration rules (รวม "Claiming a number").
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — runbook.
- [`frontend/design.md`](frontend/design.md) — design system tokens (อ่านก่อนแตะ UI ทุกครั้ง).
- [`frontend/AGENTS.md`](frontend/AGENTS.md) — note เรื่อง Next.js 16 breaking changes.

## หลักการที่ต้องรู้ (สรุปสั้น — รายละเอียดดู `AGENTS.md`)

- **Backend layered:** handler decode/validate → service (business logic + permission + tx) → db (sqlc, ห้ามแก้มือ).
- **Permissions:** membership gate คืน **404 ไม่ใช่ 403** (กัน enumeration). Backend คือ source of truth.
- **WebSocket:** record `activities` row **ก่อน** broadcast เสมอ. WS handlers ต้อง idempotent.
- **Frontend state:** ใช้ Zustand store ที่มี (`useBoardStore` ฯลฯ) — ห้ามสร้าง global Context สำหรับ board data. Optimistic UI: apply local → fire API → revert ถ้าพัง.
- **UI:** ใช้ token จาก `frontend/design.md` เท่านั้น, ห้าม hardcode สี/ขนาด. Component target ≤ 200 บรรทัด. Copy เป็นภาษาไทยอ่านง่าย.

## สถานะปัจจุบัน (ณ 2026-05-30)

- **Personal workspace = My Work** (`frontend/src/app/(project)/my-work`): หน้าเดียวแบบ
  **single-viewport dashboard** จัดลำดับความสำคัญแบบ **Today-first** — hero "วันนี้ต้องทำ"
  เป็น primary (ซ้าย) + overdue เป็น strip ย่อ/มิวต์ใต้ hero, ขวาเป็น กำหนดส่งที่จะถึง +
  ไม่มีวันที่. Today ถูกรวมเข้ามาแล้ว; `/today` redirect → `/my-work`. ดูรายละเอียดที่
  section "Personal Workspace pattern" ใน `AGENTS.md`.
- Branch หลัก: `main`.
