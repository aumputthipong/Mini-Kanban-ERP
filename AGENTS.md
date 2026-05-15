# AGENTS.md — Turtask (Mini ERP Kanban)

Working agreement สำหรับ AI coding agents ที่เข้ามาช่วยพัฒนา project นี้. อ่านไฟล์นี้ก่อนเขียนโค้ดบรรทัดแรก.

## Project at a glance

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · @dnd-kit
- **Backend:** Go 1.25 · chi · sqlc · pgx/v5 · Gorilla WebSocket · golang-migrate · JWT
- **Database:** PostgreSQL 15 · UUID v4 keys · migrations รันอัตโนมัติตอน startup
- **Realtime:** WebSocket hub (1 room ต่อ board), optimistic UI ฝั่ง client

อ่านบริบทเพิ่ม:
- [`README.md`](README.md) — quick start
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layered design, permission matrix, WS hub, ที่จงใจไม่ทำ
- [`docs/DATABASE.md`](docs/DATABASE.md) — ERD, table notes, migration rules
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — runbook
- [`design.md`](design.md) — **design system tokens** (อ่านก่อนแตะ UI ทุกครั้ง)

---

## UI / Design rule — อ่านให้จบ

ทุกครั้งที่ทำงานที่มีผลกับสิ่งที่ผู้ใช้เห็น **ต้องเช็คกับ [`design.md`](design.md) ก่อน**. กรณีที่ trigger rule นี้:

- สร้าง page / route ใหม่ใน `frontend/src/app/`
- สร้าง component ใหม่ใน `frontend/src/components/`
- แก้ layout, spacing, สี, ตัวอักษร, มุมโค้ง, หรือ visual state ใด ๆ
- เพิ่ม button, chip, badge, modal, toast, form input ใหม่
- เพิ่ม CSS class / Tailwind utility ที่กำหนดค่า raw (`bg-[#XXXXXX]`, `text-[16px]`, `rounded-[10px]`, ฯลฯ)
- เปลี่ยน iconography, typography scale, หรือ visual hierarchy

### ขั้นตอนเช็ค

1. **อ่าน `design.md`** — ดู YAML frontmatter (tokens) และ section ที่เกี่ยวข้อง (Colors / Typography / Layout / Shapes / Components / Do's and Don'ts).
2. **ใช้ token ที่มีอยู่เท่านั้น** — เช่น `{colors.primary}`, `{spacing.md}`, `{rounded.sm}`. ห้ามฮาร์ดโค้ดสี/ขนาดใหม่.
3. **ถ้า token ที่ต้องการไม่มี** — **อย่าเพิ่งเขียนค่า inline**. หยุดก่อน, ถามผู้ใช้ว่าจะเพิ่ม token ใหม่ใน `design.md` หรือ map ไปใช้ token ที่ใกล้เคียงที่สุด.
4. **ถ้าแก้ `design.md`** — รัน `npm run design:link` ต้องผ่าน **0 errors, 0 warnings** ก่อน commit. info findings (token summary) ยอมรับได้.
5. **เคารพ Do's & Don'ts** ใน `design.md` — เช่น "หนึ่ง `button-primary` ต่อ view", "status colors ใช้บน chip/toast เท่านั้น", "ไม่เพิ่ม corner radius ที่สาม".

### Anti-patterns ที่ห้าม

- ❌ `className="bg-[#2563EB] text-white rounded-[10px] p-[14px]"` — ใช้ token แทน
- ❌ ปั้น component ใหม่ที่ทับซ้อนกับของที่มี (`Button`, `Card`, `Tag`) แทนที่จะ reuse
- ❌ เพิ่ม font family / weight ใหม่โดยไม่อัปเดต `design.md`
- ❌ ใส่สีสถานะ (success/danger) บน prose, link, หรือ background ของ layout

---

## Backend rules

### Layered architecture — ห้ามข้ามชั้น

```
handler/  → service/  → db/ (sqlc-generated)
```

- **handler/** decode + validate → call service → encode response. 10–30 บรรทัดต่อ handler.
- **service/** business logic + permission check + transaction. ที่เดียวที่กฎ domain อาศัยอยู่.
- **db/** sqlc generated **ห้ามแก้ด้วยมือ**. เปลี่ยน query ที่ `database/queries.sql` แล้วรัน `make sqlc`.

### Permissions

- ใช้ `middleware.RequireBoardMember` แล้วตามด้วย `RequireBoardRole(core.Role...)` เสมอ.
- Membership gate คืน **404** (ไม่ใช่ 403) เพื่อกัน enumeration. **ห้าม** เปลี่ยนเป็น 403.
- Frontend mirror permission matrix สำหรับ hide UI; backend คือ source of truth — **ห้าม** trust client.

### Database / Migrations

- New migration: `make migrate-new name=add_x` (หรือสร้างไฟล์ `00000N_*.{up,down}.sql` ใต้ `backend/database/migrations/`).
- Up migration ควร additive. Destructive change ต้องมี backfill plan.
- Down migration ต้อง revert ได้จริง หรือเว้นว่างพร้อม comment ว่าทำไม.
- หลังแก้ schema/queries → `make sqlc` แล้ว commit ทั้ง SQL และ generated Go.

### WebSocket events

- Record `activities` row **ก่อน** broadcast เสมอ — audit log เป็น source of truth.
- WS handlers ต้อง **idempotent** — รับ event ของ state ที่เป็นอยู่แล้ว = no-op (เพราะ writer ไม่ filter broadcast ของตัวเอง).
- เพิ่ม event type ใหม่ → อัปเดต enum ทั้งฝั่ง Go และ TypeScript พร้อมกัน.

---

## Frontend rules

- **State:** ใช้ Zustand store ที่มี (`useBoardStore`, `useToastStore`, `useActivityStore`). **ห้าม** สร้าง global Context สำหรับ board data — re-render ทั้ง tree.
- **Optimistic UI pattern:** apply local → fire API → revert ถ้าพัง. ดู `useBoardStore.moveCard` เป็น reference.
- **API client:** ใช้ `lib/apiClient` ที่มีอยู่ — มัน post toast เองตอน 403/5xx อยู่แล้ว, **ห้าม** ทำซ้ำใน handler.
- **Next.js 16:** อ่าน `frontend/AGENTS.md` — API/conventions อาจต่างจาก training data, เช็ค `node_modules/next/dist/docs/` ก่อนเขียน.

---

## Testing & verification

ก่อนรายงานว่างานเสร็จ:

| ประเภทงาน          | ต้องรัน                                              |
|---------------------|------------------------------------------------------|
| Backend logic       | `make test` (`go test ./...`)                        |
| Frontend logic      | `make test-fe` (vitest)                              |
| Frontend types      | `make typecheck` (`tsc --noEmit`)                    |
| **UI change**       | `npm run design:link` + เปิด browser ทดสอบจริง       |
| E2E flow            | `make test-e2e` (Playwright)                         |
| ทั้งหมดที่ CI รัน    | `make verify`                                        |

> สำหรับ UI: type check และ unit test ยืนยันแค่ correctness ของโค้ด **ไม่ใช่** correctness ของ feature. ถ้าทดสอบ UI จริงไม่ได้ ต้องบอกตรง ๆ ห้ามอ้างว่าเสร็จ.

---

## Commit & PR hygiene

- Conventional commits style ตามที่ใช้อยู่ใน `git log` (`fix(lint):`, `chore(ci):`, `feat(board):` ฯลฯ).
- **ห้าม** commit generated files แยกจาก source — `sqlc` output ไปกับ query change เสมอ.
- **ห้าม** ใส่ `.env` หรือ secret ลง repo. `.env.example` คือที่เดียวที่ document env vars.
- **ห้าม** ใช้ `--no-verify` เพื่อข้าม pre-commit hook. ถ้า hook พัง — fix root cause.

---

## ที่ตั้งใจไม่ทำ (อย่าเสนอเพิ่ม)

- ❌ ORM — sqlc + service layer พอ
- ❌ GraphQL — REST + WS ครอบคลุมแล้ว
- ❌ Redis cache / pub-sub — ใส่เมื่อมี hot path จริง
- ❌ Microservices — single binary
- ❌ Event sourcing — `activities` คือ audit log ไม่ใช่ state log

ถ้าจะเสนอเพิ่มของพวกนี้ — เขียนเหตุผลที่ trigger การเปลี่ยน design ลง `docs/decisions/` แล้วถามผู้ใช้ก่อน.
