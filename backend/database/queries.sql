-- name: GetAllBoards :many
SELECT id, title, created_at 
FROM boards 
ORDER BY created_at DESC;

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

-- name: CreateBoard :one
INSERT INTO boards (id, title, created_at, updated_at)
VALUES (gen_random_uuid(), $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING id, title;

-- name: CreateColumn :one
INSERT INTO columns (id, board_id, title, position, created_at, updated_at)
VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING id, board_id, title, position;

-- name: CreateCard :one
INSERT INTO cards (id, column_id, title, position, created_at, updated_at)
VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING id, column_id, title, position, created_at, updated_at;

-- name: UpdateCardColumn :exec
UPDATE cards
SET column_id = $1, position = $2, updated_at = NOW()
WHERE id = $3;

-- name: DeleteCard :exec
DELETE FROM cards WHERE id = $1;