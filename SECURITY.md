# Security Policy

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security reports.

Use GitHub's private vulnerability reporting instead:

1. Go to the [Security tab](https://github.com/aumputthipong/Kanban-management/security) of this repository
2. Click **Report a vulnerability**
3. Fill in the form — the maintainer will be notified privately

You should expect an initial acknowledgement within **7 days**. If the issue
is confirmed, we'll work on a fix and coordinate a disclosure timeline with
you before any public announcement.

## Scope

In scope:

- Code in `backend/`, `frontend/`, and the deploy configuration
- Auth, permission, and CORS logic
- WebSocket hub message handling
- SQL queries (sqlc) and migrations

Out of scope:

- Vulnerabilities in third-party dependencies — please report those upstream
  (we track CVEs via `govulncheck` and `npm audit` in CI)
- Issues that require a compromised account or local machine access
- Rate limits, brute force on public endpoints (already mitigated by
  `middleware.AuthRateLimit` / `GeneralRateLimit`)

## Supported versions

Only the `main` branch is supported. Tagged releases are point-in-time
snapshots — security fixes land on `main` and are not back-ported.
