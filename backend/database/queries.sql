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
SELECT 
    c.id,
    c.column_id,
    c.title,
    c.description,
    c.position,
    c.due_date,
    c.estimated_hours,
    c.assignee_id,
    u.full_name AS assignee_name
FROM cards c
LEFT JOIN users u ON c.assignee_id = u.id
WHERE c.column_id = ANY($1::uuid[])
ORDER BY c.position ASC;


-- name: CreateBoard :one
INSERT INTO boards (id, title, created_at, updated_at)
VALUES (gen_random_uuid(), $1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING id, title;

-- name: CreateColumn :one
INSERT INTO columns (id, board_id, title, position, created_at, updated_at)
VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
RETURNING id, board_id, title, position;

-- name: CreateCard :one
INSERT INTO cards (column_id, title, position, due_date, assignee_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, column_id, title, position, due_date, assignee_id;

-- name: UpdateCardColumn :exec
UPDATE cards
SET column_id = $1, position = $2, updated_at = NOW()
WHERE id = $3;

-- name: DeleteCard :exec
DELETE FROM cards WHERE id = $1;