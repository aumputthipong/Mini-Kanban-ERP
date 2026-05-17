# Backend — Turtask API

Go 1.25 · chi · sqlc · pgx/v5 · Gorilla WebSocket · golang-migrate · JWT.

> Quick reference only. Architecture rationale lives in
> [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md); rules for AI agents
> live in [`../AGENTS.md`](../AGENTS.md).

## Run locally

```bash
cp .env.example .env          # fill in DB_URL, JWT_SECRET, etc.
go run ./cmd/api              # listens on :8080 by default
```

Migrations run automatically on startup. Set `SKIP_MIGRATIONS=true` to opt
out (useful when running migrations out-of-band).

## Layout

```
cmd/api/                 main + composition root
database/
  migrations/            golang-migrate SQL files (NNNNNN_*.up/down.sql)
  queries.sql            sqlc input — edit this, then `make sqlc`
internal/
  core/                  domain types + role enum
  db/                    sqlc-generated repository (do NOT edit by hand)
  dto/                   wire format for requests/responses
  handler/               HTTP boundary — decode, call service, encode
  httputil/              error envelope, JSON helpers, UUID param parser
  mapper/                domain ↔ DTO conversion
  middleware/            auth, board access/role, CORS, rate-limit, headers
  service/               business logic + permission + transaction
  token/                 JWT issue/validate
  websocket/             hub + per-board rooms
sqlc.yaml                sqlc codegen config
```

## Common tasks

| Task                                 | Command (from repo root)                              |
|--------------------------------------|-------------------------------------------------------|
| Run tests with race detector         | `make test`                                           |
| Regenerate sqlc after `queries.sql`  | `make sqlc`                                           |
| New migration                        | `make migrate-new name=add_x`                         |
| Regenerate OpenAPI spec              | `make swag`                                           |
| `go vet` + `go test` + tsc + vitest  | `make verify`                                         |

## API docs

When the server is running, Swagger UI is served at
<http://localhost:8080/docs/index.html>. Raw OpenAPI JSON at
<http://localhost:8080/docs/doc.json>.

## Health

`GET /healthz` returns JSON `{status, version, uptime_seconds, db_connected}`.
Pings the pool with a 2-second timeout — 503 if the DB is down. Use for k8s
liveness or external uptime probes.
