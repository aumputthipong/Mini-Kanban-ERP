# Load tests

Baseline scenarios for the Turtask backend, run with [k6](https://k6.io).
Goal is a repeatable p95-latency number per scenario so we can tell whether
a change is a regression.

## Prerequisites

- A running backend reachable on `BASE_URL` (defaults to `http://localhost:8080`)
- A seeded user account; export `EMAIL` and `PASSWORD` env vars before running
- One existing board the user is a member of; export its UUID as `BOARD_ID`

## Run

```bash
k6 run \
  -e BASE_URL=http://localhost:8080 \
  -e EMAIL=demo@example.com \
  -e PASSWORD=secret \
  -e BOARD_ID=00000000-0000-0000-0000-000000000000 \
  loadtest/board-move.js
```

## Reading the output

The script prints p50/p95/p99 for two custom trends:

- `board_load_latency` — GET `/api/boards/{id}` (the heavy read path)
- `card_patch_latency` — PATCH `/api/cards/{id}` (the hot write path)

Save the numbers in your PR description as a before/after table when you're
proposing a perf change.
