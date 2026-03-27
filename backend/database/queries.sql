-- name: CreateBoard :one
INSERT INTO boards (title, budget)
VALUES ($1, $2)
RETURNING *;

-- name: ListBoards :many
SELECT * FROM boards
ORDER BY created_at DESC;

-- name: CreateColumn :one
INSERT INTO columns (board_id, title, position)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateCardColumn :exec
UPDATE cards
SET column_id = $1, position = $2, updated_at = NOW()
WHERE id = $3;

-- name: GetColumnsByBoardID :many
SELECT id, board_id, title, position, created_at
FROM columns 
WHERE board_id = $1 
ORDER BY position ASC;

-- name: GetCardsByColumnIDs :many
SELECT id, column_id, assignee_id, title, description, estimated_hours, position, created_at, updated_at 
FROM cards 
WHERE column_id = ANY($1::uuid[]) 
ORDER BY position ASC;

-- name: CreateCard :one
INSERT INTO cards (id, column_id, title, position, created_at, updated_at)
VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING id, column_id, title, position, created_at, updated_at;