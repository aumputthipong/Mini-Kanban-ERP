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
INSERT INTO cards (column_id, title, position, due_date, assignee_id, priority, created_by)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, column_id, title, description, position, due_date, assignee_id, priority, created_by;

-- name: UpdateCardColumn :exec
UPDATE cards
SET 
    column_id = $1,
    position = $2,
    is_done = $3,
    completed_at = $4,
    updated_at = NOW()
WHERE id = $5;

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



-- name: CreateUser :one
INSERT INTO users (email, full_name, password_hash, provider, provider_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1 LIMIT 1;

-- name: GetUserByProviderID :one
SELECT * FROM users 
WHERE provider = $1 AND provider_id = $2 
LIMIT 1;

-- name: UpsertOAuthUser :one
INSERT INTO users (email, full_name, provider, provider_id)
VALUES ($1, $2, $3, $4)
ON CONFLICT (email) 
DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    provider_id = EXCLUDED.provider_id
RETURNING *;

-- name: GetAllUsers :many
SELECT id, email, full_name FROM users ORDER BY full_name ASC;



-- name: AddBoardMember :one
INSERT INTO board_members (board_id, user_id, role)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetBoardMembers :many
SELECT 
    bm.id,
    bm.role,
    bm.joined_at,
    u.id       AS user_id,
    u.email,
    u.full_name
FROM board_members bm
JOIN users u ON bm.user_id = u.id
WHERE bm.board_id = $1
ORDER BY bm.joined_at ASC;

-- name: RemoveBoardMember :exec
DELETE FROM board_members
WHERE board_id = $1 AND user_id = $2;

-- name: UpdateBoardMemberRole :one
UPDATE board_members
SET role = $3
WHERE board_id = $1 AND user_id = $2
RETURNING *;

-- name: GetBoardMemberRole :one
SELECT role FROM board_members
WHERE board_id = $1 AND user_id = $2;


-- name: GetCard :one
SELECT * FROM cards 
WHERE id = $1 LIMIT 1;


-- name: GetSubtasksByCardID :many
SELECT * FROM card_subtasks
WHERE card_id = $1
ORDER BY position ASC;

-- name: CreateSubtask :one
INSERT INTO card_subtasks (card_id, title, position)
VALUES ($1, $2, $3)
RETURNING *;

-- name: UpdateSubtask :one
UPDATE card_subtasks
SET 
    title = COALESCE($2, title),
    is_done = COALESCE($3, is_done),
    position = COALESCE($4, position),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteSubtask :exec
DELETE FROM card_subtasks
WHERE id = $1;


-- name: GetColumnCategory :one
SELECT category
FROM columns
WHERE id = $1;

-- name: GetSubtask :one
SELECT * FROM card_subtasks WHERE id = $1 LIMIT 1;

-- name: UpdateSubtaskDone :exec
UPDATE card_subtasks
SET
    is_done = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;