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