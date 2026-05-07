[![CI](https://github.com/aumputthipong/Kanban-management/actions/workflows/ci.yml/badge.svg)](https://github.com/aumputthipong/Kanban-management/actions/workflows/ci.yml)

# Turtask — Mini ERP Kanban

A real-time team task & project management web app. Multi-board Kanban with role-based permissions, optimistic drag-and-drop, WebSocket sync, a cross-board **My Tasks** view, and a per-board analytics dashboard.

> Status: actively developed, single-author portfolio project.

---

## Highlights

- **Realtime sync** — card moves and edits broadcast to every viewer via a WebSocket hub
- **Optimistic UI** — drag-and-drop updates locally first, reconciles with the server
- **Permission matrix** — owner / manager / member, enforced at middleware + UI
- **My Tasks** — cross-board work grouped by date *and* by project, with column-aware rows
- **Project Overview** — Up Next list, Team Workload, Activity feed, auto bottleneck insights
- **Type-safe SQL** — sqlc-generated queries; no ORM, no runtime surprises

## Tech stack

| Layer    | Tech                                                                 |
|----------|----------------------------------------------------------------------|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand · @dnd-kit · NextAuth (Google) |
| Backend  | Go 1.25 · chi · sqlc · pgx/v5 · Gorilla WebSocket · golang-migrate · JWT |
| Database | PostgreSQL 15 · UUID v4 keys                                         |
| Infra    | Docker · Docker Compose                                              |

## Architecture

```
                 ┌────────────┐  HTTP (REST, JWT cookie)   ┌──────────────┐
   Browser ───▶  │  Next.js   │ ───────────────────────▶  │   Go API     │
                 │  (App      │ ◀───── WebSocket  ─────── │   chi +      │
                 │   Router)  │        broadcast           │   WS Hub     │
                 └────────────┘                            └──────┬───────┘
                                                                  │ pgx
                                                                  ▼
                                                          ┌───────────────┐
                                                          │ PostgreSQL    │
                                                          │ (sqlc-typed)  │
                                                          └───────────────┘
```

- **Layered backend** — handler → service → repository (sqlc generated)
- **WebSocket hub** — per-board rooms; broadcasts card moves, edits, activities
- **Frontend store** — single Zustand store; WS messages mutate it directly

Deeper docs:

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layered design, permission matrix, optimistic UI pattern, what's intentionally not here
- [docs/DATABASE.md](docs/DATABASE.md) — ERD (Mermaid), table-by-table notes, migration rules
- [docs/DEPLOY.md](docs/DEPLOY.md) — pre-flight checklist, deploy paths (VPS / Vercel+Railway / Cloud Run), rollback, common breakages
- **API spec** — interactive Swagger UI served at `/docs/index.html` once the backend is running. Raw spec at `/docs/doc.json`. Regenerate after editing handler annotations: `cd backend && go generate ./cmd/api` (requires `swag` — `go install github.com/swaggo/swag/cmd/swag@latest`).

## Project structure

```text
mini-erp-kanban/
├── backend/
│   ├── cmd/api/              # main.go + routes.go (entrypoint)
│   ├── database/
│   │   ├── schema.sql        # base schema
│   │   ├── migrations/       # golang-migrate up/down files
│   │   └── queries.sql       # sqlc input
│   ├── internal/
│   │   ├── handler/          # HTTP handlers
│   │   ├── service/          # business logic + permission checks
│   │   ├── middleware/       # auth, CORS, board-membership, role gating
│   │   ├── db/               # sqlc-generated code (do not edit by hand)
│   │   ├── websocket/        # Hub + Client
│   │   ├── migrate/          # startup migration runner
│   │   ├── token/            # JWT issuance/validation
│   │   └── ...
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # UI (board, my-tasks, dashboard, ...)
│   │   ├── hooks/            # useWebSocket, useDashboardStats, ...
│   │   ├── store/            # Zustand stores
│   │   └── lib/              # apiClient, constants
│   ├── Dockerfile
│   └── .env.example
├── docs/                     # ARCHITECTURE.md · DATABASE.md · DEPLOY.md
├── docker-compose.yml        # dev: Postgres only
└── docker-compose.prod.yml   # full stack: db + backend + frontend
```

---

## Quick start

### Prerequisites

- Docker + Docker Compose **or**
- Node.js 20+ · Go 1.25+ · PostgreSQL 15 (running locally)

### Option A — Full stack via Docker (recommended)

```bash
git clone <repo-url>
cd mini-erp-kanban

# Create root .env for compose vars
cat > .env <<'EOF'
POSTGRES_USER=erp_user
POSTGRES_PASSWORD=erp_password
POSTGRES_DB=erp_kanban
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/google/callback
EOF

docker compose -f docker-compose.prod.yml up --build
```

Then open <http://localhost:3000>. Migrations run automatically on backend startup.

### Option B — Local dev (Postgres in Docker, backend + frontend on host)

```bash
# 1. Database
docker compose up -d                          # uses docker-compose.yml (Postgres only)

# 2. Backend
cd backend
cp .env.example .env                          # then edit values
go run ./cmd/api                              # migrations run on boot

# 3. Frontend (new shell)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

### Verifying the install

```bash
curl http://localhost:8080/healthz | jq
# { "status": "ok", "version": "dev", "uptime_seconds": 12, "db_connected": true }
```

---

## Environment variables

Both `backend/.env.example` and `frontend/.env.example` document every variable the code reads. Required:

- `JWT_SECRET` — 32+ random bytes (`openssl rand -base64 32`)
- `DB_URL` — Postgres connection string
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` — frontend ↔ backend URLs

Optional (Google OAuth login): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL`.

## Common tasks

A top-level [`Makefile`](Makefile) wraps the most-used commands. `make` with no target lists them. Direct equivalents below if you'd rather not use `make`:

| Task                                | `make`                | Direct                                                  |
|-------------------------------------|-----------------------|---------------------------------------------------------|
| Verify everything CI runs           | `make verify`         | `go vet + go test + tsc + vitest`                       |
| Run backend tests                   | `make test`           | `cd backend && go test ./...`                           |
| Frontend type check                 | `make typecheck`      | `cd frontend && npx tsc --noEmit`                       |
| Regenerate sqlc                     | `make sqlc`           | `cd backend && sqlc generate`                           |
| New migration stub                  | `make migrate-new name=add_x` | (manual file creation under `database/migrations/`) |
| Regenerate OpenAPI spec             | `make swag`           | `cd backend && go generate ./cmd/api`                   |
| Build production images             | `make build`          | `docker compose -f docker-compose.prod.yml build`       |
| Inspect health                      | —                     | `curl localhost:8080/healthz`                           |
| Browse API docs                     | —                     | <http://localhost:8080/docs/index.html>                 |

## Deployment notes

- Container images are multi-stage: backend ends on `distroless/static:nonroot`, frontend on `node:20-alpine` with `output: "standalone"`.
- Migrations run on every backend startup (idempotent — uses `golang-migrate`). Set `SKIP_MIGRATIONS=true` to disable.
- Connection pool defaults: `MaxConns=25`, `MinConns=5`, `MaxConnIdleTime=5m`. Tune via `DB_URL` query params if needed.
- Graceful shutdown: 30 s drain on `SIGTERM` / `SIGINT`.

See [docs/DEPLOY.md](docs/DEPLOY.md) for the full pre-flight checklist, deploy paths, smoke tests, rollback procedure, and common breakages.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for branch / commit conventions, the PR checklist, and what to run before opening a PR. Notable changes are tracked in [`CHANGELOG.md`](CHANGELOG.md).

## License

[MIT](LICENSE) © aumputthipong
