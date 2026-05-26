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
- [`frontend/design.md`](frontend/design.md) — **design system tokens** (อ่านก่อนแตะ UI ทุกครั้ง)

---

## UI / Design rule — อ่านให้จบ

ทุกครั้งที่ทำงานที่มีผลกับสิ่งที่ผู้ใช้เห็น **ต้องเช็คกับ [`frontend/design.md`](frontend/design.md) ก่อน**. กรณีที่ trigger rule นี้:

- สร้าง page / route ใหม่ใน `frontend/src/app/`
- สร้าง component ใหม่ใน `frontend/src/components/`
- แก้ layout, spacing, สี, ตัวอักษร, มุมโค้ง, หรือ visual state ใด ๆ
- เพิ่ม button, chip, badge, modal, toast, form input ใหม่
- เพิ่ม CSS class / Tailwind utility ที่กำหนดค่า raw (`bg-[#XXXXXX]`, `text-[16px]`, `rounded-[10px]`, ฯลฯ)
- เปลี่ยน iconography, typography scale, หรือ visual hierarchy

### ขั้นตอนเช็ค

1. **อ่าน `frontend/design.md`** — ดู YAML frontmatter (tokens) และ section ที่เกี่ยวข้อง (Colors / Typography / Layout / Shapes / Components / Do's and Don'ts).
2. **ใช้ token ที่มีอยู่เท่านั้น** — เช่น `{colors.primary}`, `{spacing.md}`, `{rounded.sm}`. ห้ามฮาร์ดโค้ดสี/ขนาดใหม่.
3. **ถ้า token ที่ต้องการไม่มี** — **อย่าเพิ่งเขียนค่า inline**. หยุดก่อน, ถามผู้ใช้ว่าจะเพิ่ม token ใหม่ใน `frontend/design.md` หรือ map ไปใช้ token ที่ใกล้เคียงที่สุด.
4. **ถ้าแก้ `frontend/design.md`** — รัน `npm run design:link` ต้องผ่าน **0 errors, 0 warnings** ก่อน commit. info findings (token summary) ยอมรับได้.
5. **เคารพ Do's & Don'ts** ใน `frontend/design.md` — เช่น "หนึ่ง `button-primary` ต่อ view", "status colors ใช้บน chip/toast เท่านั้น", "ไม่เพิ่ม corner radius ที่สาม".

### Anti-patterns ที่ห้าม

- ❌ `className="bg-[#2563EB] text-white rounded-[10px] p-[14px]"` — ใช้ token แทน
- ❌ ปั้น component ใหม่ที่ทับซ้อนกับของที่มี (`Button`, `Card`, `Tag`) แทนที่จะ reuse
- ❌ เพิ่ม font family / weight ใหม่โดยไม่อัปเดต `frontend/design.md`
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
- **Number conflicts:** อย่า reuse number ที่ merge ไป main แล้ว แม้ feature นั้นถูก revert. golang-migrate ต้อง find file ของ version ใน schema_migrations เพื่อ start. ดู [`docs/DATABASE.md` → Claiming a number](docs/DATABASE.md#claiming-a-number) สำหรับ process + `IF EXISTS` cleanup pattern.

### WebSocket events

- Record `activities` row **ก่อน** broadcast เสมอ — audit log เป็น source of truth.
- WS handlers ต้อง **idempotent** — รับ event ของ state ที่เป็นอยู่แล้ว = no-op (เพราะ writer ไม่ filter broadcast ของตัวเอง).
- เพิ่ม event type ใหม่ → อัปเดต enum ทั้งฝั่ง Go และ TypeScript พร้อมกัน.

### REST API conventions

- **Endpoint shape:**
  - `/api/boards/:boardID/<resource>` สำหรับ list / create (board scope ชัดใน URL — middleware gate ทำงานทันที)
  - `/api/<resource>/:id` สำหรับ touch by ID — handler resolve board_id ก่อน re-check membership (404 not 403 on miss, anti-enumeration)
- **DTO fields ทั้ง optional ใช้ `*type`** (pointer) — เพื่อให้ omit vs explicit distinguishable ที่ unmarshal.
- **PATCH semantics:**
  - field omit หรือ JSON `null` → **no change** (Go's *string ไม่สามารถแยก 2 case นี้ — convention collapse)
  - `""` บน nullable column → store "" (≈ NULL ที่ app layer)
  - `""` บน required column → **400 bad request** (validator's `omitempty,min=1` catches it; กัน defense-in-depth ที่ handler ด้วย)
  - SQL update ใช้ `COALESCE(sqlc.narg(...), <existing>)` กับ **ทุก field** — แม้ nullable ก็ใช้, ไม่อย่างนั้น omit จะ silently clobber
- **Activity log (REST path):** service mutation → return → handler call `activity.Record(...)` → respond. Best-effort: ถ้า audit fail แค่ log + ดำเนินต่อ (mutation already committed). อย่ารวมใน tx นอกจาก case critical จริง ๆ.
- **Error mapping ที่ handler:** `errors.Is(err, sentinel)` → typed HTTP code. ตัวอย่าง:
  - `ErrPlanningItemAlreadyPromoted` → 409
  - `ErrPlanningItemDropped` / `ErrPlanningNoTodoColumn` → 422 (user-actionable)
  - `pgx.ErrNoRows` → 404
  - default → 500

---

## Frontend rules

- **State:** ใช้ Zustand store ที่มี (`useBoardStore`, `useToastStore`, `useActivityStore`). **ห้าม** สร้าง global Context สำหรับ board data — re-render ทั้ง tree.
- **Optimistic UI pattern:** apply local → fire API → revert ถ้าพัง. ดู `useBoardStore.moveCard` เป็น reference.
- **API client:** ใช้ `lib/apiClient` ที่มีอยู่ — มัน post toast เองตอน 403/5xx อยู่แล้ว, **ห้าม** ทำซ้ำใน handler.
- **API URL convention:** endpoint paths ไม่มี `/api` prefix — `NEXT_PUBLIC_API_URL` รวม `/api` ให้แล้ว. เขียน `/boards/${id}/...` ไม่ใช่ `/api/boards/${id}/...` (ดู `useCardActions`, `planningApi` เป็น reference).
- **Component size:** target **≤ 200 บรรทัด/ไฟล์**. เกินแล้ว → extract sub-components หรือ custom hook. exception ได้ถ้าเป็น coherent unit (ItemRow, useSessionItems) แต่ document เหตุผลใน commit.
- **Thai-first copy:** UI text + toast + error message เป็นภาษาไทยที่อ่านง่าย, ไม่ใช่ jargon ภาษาอังกฤษ. type chip code (REQ/DEC/Q) เก็บไว้เพื่อ density แต่ tooltip เป็นไทย.
- **Refs ที่ส่ง parent → child:** ส่ง `RefObject` เป็น prop ตรง ๆ ไม่ใช่ `useImperativeHandle` (ดู `<CaptureInput inputRef={...}/>` เป็น reference).
- **Next.js 16:** อ่าน `frontend/AGENTS.md` — API/conventions อาจต่างจาก training data, เช็ค `node_modules/next/dist/docs/` ก่อนเขียน.

### Data fetching & loading states

ทุกหน้า/component ที่ fetch data **ต้อง** มี loading state แสดงเป็น skeleton — ห้ามขึ้นแค่ข้อความ "Loading…" หรือหน้าเปล่าก่อน data มาถึง

- **Server-rendered async page** (`async function Page()`): สร้าง `loading.tsx` ข้าง ๆ `page.tsx` — Next.js จะใช้เป็น Suspense fallback อัตโนมัติ
- **Client hook ที่ fetch เอง**: hook ต้องคืน `isLoading` flag ใส่ `cancel guard` (let cancelled = false; return () => cancelled = true) ใน cleanup ของ `useEffect`
- **`setState` ใน effect**: ห้ามเรียก `setState` แบบ synchronous ตรง ๆ ใน effect body — React 19 + `react-hooks/set-state-in-effect` จะเป็น error
  - ถ้าต้อง reset state เมื่อ prop เปลี่ยน → ใช้ **setState-during-render pattern** (track ค่าเดิมใน state, เทียบใน body, set ก่อน return JSX) ไม่ใช่ทำใน useEffect
  - setState ใน callback ของ Promise/event listener/subscription — ทำได้ปกติ
- **`useEffect` dependency**: ใส่ deps ให้ครบเสมอ ถ้า Zustand setter stable แล้วต้อง suppress — ใส่ `// eslint-disable-next-line react-hooks/exhaustive-deps` พร้อม comment อธิบายว่า*ทำไม*

### Skeleton conventions

- ใช้ `<Skeleton>` primitive จาก `frontend/src/components/ui/Skeleton.tsx` เสมอ — **ห้าม** เขียน `animate-pulse bg-slate-...` inline กระจาย
- Skeleton shape ต้องตรง content จริง (ขนาดเดียวกัน, จำนวนคอลัมน์/แถวเดียวกัน) เพื่อไม่ให้หน้าสะดุดตอน hydrate
- Composite skeleton ที่ใช้ซ้ำ ≥ 2 ที่ → ย้ายเป็น component แยก (`MembersSkeleton`, `BoardSkeleton` ฯลฯ)
- ห้ามใช้ `<Skeleton>` แทน empty state — "ไม่มีข้อมูล" ไม่ใช่ "กำลังโหลด"

---

## Testing & verification

ก่อนรายงานว่างานเสร็จ:

| ประเภทงาน          | ต้องรัน                                              |
|---------------------|------------------------------------------------------|
| Backend logic       | `make test` (`go test ./...`)                        |
| Backend critical path | `make test-integration` (real Postgres via Docker) |
| Frontend logic      | `make test-fe` (vitest)                              |
| Frontend types      | `make typecheck` (`tsc --noEmit`)                    |
| **UI change**       | `npm run design:link` + เปิด browser ทดสอบจริง       |
| E2E flow            | `make test-e2e` (Playwright)                         |
| ทั้งหมดที่ CI รัน    | `make verify`                                        |

> สำหรับ UI: type check และ unit test ยืนยันแค่ correctness ของโค้ด **ไม่ใช่** correctness ของ feature. ถ้าทดสอบ UI จริงไม่ได้ ต้องบอกตรง ๆ ห้ามอ้างว่าเสร็จ.

### Test patterns

- **Backend handlers:** mock service at the interface boundary (`MockBoardService`, `MockPlanningService`, `MockActivityRecorder` ใน `internal/service/mock/`). อย่า mock `pgx` ตรง ๆ — service layer คือ test seam.
- **Service-layer integration (real DB):** ใช้ `internal/testutil` (testcontainers-go) สำหรับ critical-path tests ที่ mock จับไม่ได้ — race condition, cross-table transaction, schema/migration drift. Pattern: `pool := testutil.NewTestDB(t); seed := testutil.NewSeed(t, pool)` → คืน fresh DB cloned จาก migrated template (~10ms ต่อ test). Build tag `//go:build integration` แยกไฟล์ test ออก — `make test` (CI fast path) skip, `make test-integration` รัน. ต้องการ Docker.
- **เมื่อไหร่ต้องเขียน integration test:** mutation ที่อยู่ใน transaction ข้าม table (เช่น `PromoteItem`), permission/race ที่ mock จับไม่ได้, query ที่ใช้ Postgres-specific feature (FOR UPDATE, advisory lock, JSON ops). ของอื่นยังคง mock service interface ตามเดิม.
- **Test naming:** `TestFunctionName_Scenario_ExpectedResult` (ตัวอย่าง: `TestPromoteItem_DroppedItem_Returns422`).
- **เพิ่ม interface ใหม่:** ทุก service struct ที่ handler depend ควรมี `*Servicer` interface คู่กัน + mock ใน `service/mock/` ตาม pattern เดิม.

---

## Commit & PR hygiene

- Conventional commits style ตามที่ใช้อยู่ใน `git log` (`fix(lint):`, `chore(ci):`, `feat(board):` ฯลฯ).
- **ห้าม** commit generated files แยกจาก source — `sqlc` output ไปกับ query change เสมอ.
- **ห้าม** ใส่ `.env` หรือ secret ลง repo. `.env.example` คือที่เดียวที่ document env vars.
- **ห้าม** ใช้ `--no-verify` เพื่อข้าม pre-commit hook. ถ้า hook พัง — fix root cause.

### PR checklist (ก่อน open หรือ ready-for-review)

- [ ] Migration number ไม่ชนกับ main หรือ open PR (ดู `docs/DATABASE.md → Claiming a number`)
- [ ] Mutation ใหม่บันทึก activity log (REST → after commit, WS → before broadcast)
- [ ] Permission ใหม่ test ผ่านทั้ง member + non-member (non-member ต้องได้ 404, ไม่ใช่ 403)
- [ ] `make verify` pass (vet + test + tsc + vitest)
- [ ] Component ใหม่ ≤ 200 บรรทัด หรือมีเหตุผลใน commit message
- [ ] UI change → เปิด browser ทดสอบจริง + เช็ค `frontend/design.md` tokens
- [ ] DTO PATCH field ที่เป็น `*string` → SQL ใช้ `COALESCE` ครบ + handler ตรวจ `""` ถ้า field required

## Lint / CI guardrails

- **ก่อน push ทุกครั้ง** รัน `make verify` (`go vet` + `go test` + `tsc --noEmit` + `vitest`) ให้ผ่าน — เป็นชุดเดียวกับ CI
- **ห้ามเพิ่ม ESLint warning ใหม่** — ขึ้น CI ก็ผ่านแต่จะสะสมไปเรื่อย ๆ ถ้าต้องเขียนโค้ดที่ trip rule:
  - แก้โค้ดให้ถูก rule ก่อน (default)
  - ถ้า rule ผิดบริบทจริง ๆ → `// eslint-disable-next-line <rule>` พร้อม comment **หนึ่งบรรทัด** อธิบายว่า*ทำไม* (ไม่ใช่ *ปิดอะไร*)
  - ห้าม blanket `/* eslint-disable */` ที่ระดับไฟล์
- **ESLint local แตก** (eslint-plugin-react incompatible กับ ESLint 10): พึ่ง CI ตรวจ lint — ถ้า CI fail ต้องไล่ดู log บรรทัด `Error:` (ไม่ใช่ `Warning:`) เพราะมีเฉพาะ error ที่ทำให้ CI red
- **TypeScript strict**: `tsc --noEmit` ต้องผ่านก่อน push ห้ามใช้ `any`/`@ts-ignore` ถ้าไม่มีเหตุผลเขียนใน comment

---

## ที่ตั้งใจไม่ทำ (อย่าเสนอเพิ่ม)

### Architecture

- ❌ ORM — sqlc + service layer พอ
- ❌ GraphQL — REST + WS ครอบคลุมแล้ว
- ❌ Redis cache / pub-sub — ใส่เมื่อมี hot path จริง
- ❌ Microservices — single binary
- ❌ Event sourcing — `activities` คือ audit log ไม่ใช่ state log

ถ้าจะเสนอเพิ่มของพวกนี้ — เขียนเหตุผลที่ trigger การเปลี่ยน design ลง `docs/decisions/` แล้วถามผู้ใช้ก่อน.

### Code anti-patterns

- ❌ Business logic ใน handler (place it in service)
- ❌ Handler เรียก `s.queries.X` ตรง ๆ — ผ่าน service เสมอ
- ❌ Skip activity log บน mutation ใหม่
- ❌ Broadcast WS ก่อน commit DB (activity log + DB commit ต้องเสร็จก่อน)
- ❌ `setState` synchronous ใน `useEffect` body (React 19 error — ใช้ setState-during-render pattern แทน)
- ❌ Read `ref.current` ใน render body (React 19 error — ใช้ callback ref + state แทน)
- ❌ Component > 200 บรรทัด ไม่ split (extract sub-component / hook)
- ❌ Emoji ใน source code, UI text, หรือ commit message (เว้นเมื่อ user request)
- ❌ Mock `pgx` ตรง ๆ — mock ที่ service interface แทน
- ❌ `--no-verify` ข้าม pre-commit hook
- ❌ `any` / `@ts-ignore` ที่ไม่มี comment อธิบาย
