-- name: GetAllBoards :many
SELECT id, title, created_at 
FROM boards 
ORDER BY created_at DESC;

-- name: GetColumnsByBoardID :many
SELECT id, board_id, title, position, created_at, updated_at
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
    c.priority,
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
INSERT INTO cards (column_id, title, position, due_date, assignee_id, priority)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, column_id, title, description, position, due_date, assignee_id, priority;

-- name: UpdateCardColumn :exec
UPDATE cards
SET column_id = $1, position = $2, updated_at = NOW()
WHERE id = $3;

-- name: DeleteCard :exec
DELETE FROM cards WHERE id = $1;


-- name: MoveBoardToTrash :exec
UPDATE boards 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE id = $1;

-- name: GetAllActiveBoards :many
SELECT id, title, created_at 
FROM boards 
WHERE deleted_at IS NULL 
ORDER BY created_at DESC;

-- name: GetTrashedBoards :many
SELECT id, title, deleted_at 
FROM boards 
WHERE deleted_at IS NOT NULL 
ORDER BY deleted_at DESC;

-- name: HardDeleteBoard :exec
-- ลบข้อมูลออกจากตารางจริง (ถ้าตั้ง ON DELETE CASCADE ไว้ ลูกๆ จะหายไปด้วย)
DELETE FROM boards 
WHERE id = $1;

-- name: RestoreBoardFromTrash :exec
UPDATE boards 
SET deleted_at = NULL 
WHERE id = $1;


-- name: UpdateBoard :one
UPDATE boards 
SET title = $2, 
    budget = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: GetBoardByID :one
SELECT * FROM boards 
WHERE id = $1 LIMIT 1;

-- name: UpdateCard :one
UPDATE cards
SET
    title            = COALESCE($2, title),
    description      = COALESCE($3, description),
    due_date         = COALESCE($4, due_date),
    assignee_id      = COALESCE($5, assignee_id),
    priority         = COALESCE($6, priority),
    estimated_hours  = COALESCE($7, estimated_hours),
    updated_at       = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;