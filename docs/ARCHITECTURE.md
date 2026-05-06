# Architecture

This doc explains how the system is laid out and *why* — the constraints behind each major decision. Read this if you're contributing or trying to understand the rationale before changing code.

## High-level flow

```
                 ┌──────────────────┐  HTTP (REST, JWT cookie)   ┌─────────────────────┐
   Browser ───▶  │  Next.js 16      │ ─────────────────────────▶ │   Go API            │
                 │  (App Router)    │ ◀──── WebSocket  ────────  │   chi + WS Hub      │
                 │  React 19        │   broadcast (CARD_*,       │                     │
                 │  Zustand store   │    COLUMN_*, ACTIVITY_*)   │                     │
                 └──────────────────┘                            └──────────┬──────────┘
                                                                            │ pgx/v5
                                                                            ▼
                                                                   ┌──────────────────┐
                                                                   │ PostgreSQL       │
                                                                   │ (sqlc-typed)     │
                                                                   └──────────────────┘
```

- **REST** for reads + writes initiated by the user (CRUD).
- **WebSocket** for fan-out: the writer's own action goes through REST + optimistic store mutation; everyone *else* in the same board receives the change via the hub.

---

## Backend

### Layered design

```
handler/  ─── HTTP boundary; decode + validate, call service, encode response
service/  ─── business logic, permission checks, transaction boundaries
db/       ─── sqlc-generated repository (do NOT edit by hand)
```

The split exists so the rules of the domain ("only owners can hard-delete a board") live in `service/` and don't leak into either the HTTP layer or the SQL layer. Handlers stay short — most are 10–30 lines and read like a script. Services accept `context.Context` for cancellation and use `pgxpool.Pool` so they can wrap multi-statement work in transactions.

### Why sqlc, not GORM

sqlc reads `database/queries.sql`, executes them against a real Postgres at codegen time, and emits Go code with concrete return types. The trade-off is verbose SQL files in exchange for:
- compile-time errors when a column is renamed
- zero ORM magic / N+1 surprises
- queries you can copy-paste into `psql` to debug

If a query gets ugly enough that hand-rolled SQL would help, write it as a service-level method that calls sqlc generated code under the hood — but don't reach for an ORM.

### Permission model

Three roles per board: `owner` > `manager` > `member` (see [`internal/core`](../backend/internal/core/)). Enforced in two layers:

1. **Membership gate** — [`middleware.RequireBoardMember`](../backend/internal/middleware/board_access.go) returns 404 (not 403) if the caller is not a member. The 404 prevents enumeration of board IDs.
2. **Role gate** — [`middleware.RequireBoardRole(core.RoleManager)`](../backend/internal/middleware/board_role.go) returns 403 if the caller is a member but lacks the required role.

Action matrix:

| Action                      | owner | manager | member |
|-----------------------------|:-----:|:-------:|:------:|
| Read board / activities     | ✅    | ✅      | ✅     |
| Create / update / move card | ✅    | ✅      | ✅     |
| Update board title / budget | ✅    | ✅      |        |
| Add / remove members        | ✅    | ✅      |        |
| Change member roles         | ✅    | ✅      |        |
| Manage tags                 | ✅    | ✅      |        |
| Move board to trash         | ✅    |         |        |
| Restore / hard-delete       | ✅    |         |        |
| Leave board                 |       | ✅      | ✅     |

The frontend mirrors this matrix for UI gating (hide buttons), but the backend is the source of truth — never trust the client.

### WebSocket hub

[`internal/websocket`](../backend/internal/websocket/) implements a simple hub with one channel per board. Each connection is bound to a `boardID` at handshake time; broadcasts only fan out to clients in that room. Activities (`ACTIVITY_CREATED`) are recorded server-side via [`ActivityService`](../backend/internal/service/activity_service.go) before the broadcast — single source of truth for the audit trail.

Failure modes:
- **Client disconnect** → client's `useWebSocket` reconnects with exponential backoff (1s → 30s, 8 attempts).
- **Server restart** → all clients reconnect on next message; the hub starts fresh — there's no in-memory state to recover.
- **Idle Cloudflare cut** (~100s) → not yet handled; planned via WS heartbeat (P1, see plan).

### Health, shutdown, migrations

- `/health` and `/healthz` return JSON `{status, version, uptime_seconds, db_connected}`. They `Ping()` the pool with a 2-second timeout — if it fails, the response is 503. Use this for k8s liveness probes / Render / Railway / UptimeRobot.
- Graceful shutdown drains in-flight requests for up to 30s on `SIGTERM`/`SIGINT` (see `main.go`).
- Migrations run automatically on startup via [`internal/migrate`](../backend/internal/migrate/) (golang-migrate + pgx/v5 driver). `SKIP_MIGRATIONS=true` opts out — useful when running migrations out-of-band in a separate job.

---

## Frontend

### App Router layout

```
src/app/
├── (auth)/            # /login, /register — own minimal layout
├── (landing)/         # / public landing page
├── (project)/         # /board, /my-tasks, /trash — sidebar + auth-gated layout
├── error.tsx          # route-level boundary (Week 2)
├── global-error.tsx   # root boundary (replaces layout if it crashes)
└── layout.tsx         # global providers (Toast, Auth, theme)
```

### State

- **Zustand** (`src/store/useBoardStore.ts`) — single store per board view; cards/columns/members live here. WebSocket messages mutate it directly; React rerenders subscribed components.
- **No Redux / no Context for board data** — Zustand's selector hooks are enough; using Context for high-frequency board mutations would re-render the entire tree.
- **Toast store** (`useToastStore`) — global UI feedback channel; the API client posts to it on 403 / 5xx so handlers don't repeat error UX.
- **Activity store** — separate from board store because it grows append-only and doesn't need to resync when switching boards.

### Optimistic UI pattern

Drag-and-drop and "complete task" actions follow:

1. Apply the change locally (`store.moveCard(...)`)
2. Fire the mutation to the API
3. On error, **revert** to the previous state (`store.setBoard(prev)`)

The WebSocket event for the same action is *idempotent* on the local store — receiving `CARD_MOVED` for a card already at that position is a no-op. This means the writer doesn't need to filter out their own broadcasts.

### Realtime hook

[`useWebSocket`](../frontend/src/hooks/useWebSocket.ts) owns:
- connection lifecycle (connect, reconnect with exp backoff, cancel on unmount)
- message dispatch into `useBoardStore` / `useActivityStore`
- exposed `status: 'connecting' | 'open' | 'reconnecting' | 'closed'` so a UI banner can react

[`BoardWebSocketContext`](../frontend/src/contexts/BoardWebSocketContext.tsx) wraps `useWebSocket` so any descendant of the board page can call `sendMessage` without re-instantiating the socket.

---

## Cross-cutting concerns

| Concern                  | Where it lives                                                            |
|--------------------------|---------------------------------------------------------------------------|
| Auth (JWT + cookie)      | `internal/token` issues, `middleware.RequireAuth` validates               |
| Input validation         | `httputil.DecodeAndValidate` + `validate:"..."` tags on DTOs              |
| Rate limiting            | `middleware.AuthRateLimit` (20/min/IP) + `GeneralRateLimit` (300/min/IP)  |
| Security headers         | `middleware.SecurityHeaders(production)` — HSTS only in prod              |
| CORS                     | `middleware.CORS(frontendURL, ...)` — single allowed origin from env      |
| Permission gating        | `middleware.RequireBoardMember` + `RequireBoardRole`                      |
| HTTP error envelope      | `httputil.NewAPIError` + `MakeHandler` → `{error, code}` JSON             |

---

## What's intentionally **not** here

- **No ORM** — sqlc + service layer is enough.
- **No GraphQL** — REST + WebSocket cover all current use cases without a schema layer to maintain.
- **No microservices** — a single Go binary; if scale becomes an issue, the WS hub is the obvious split point (Redis pub/sub broker), not the auth or board domain.
- **No Redis cache** — board reads are fast against the typed sqlc queries; introduce caching only when an actual hot path appears.
- **No event-sourcing** — `activities` table is append-only audit, not a rebuild-state log.

If any of these get added, document the trigger in `docs/decisions/` so future contributors know what changed.
