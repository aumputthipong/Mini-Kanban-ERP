-- Renormalize all card positions to use 65536-gap strategy
-- เรียงตาม position เดิม (เก็บลำดับเดิมไว้) แล้ว assign ใหม่เป็น 65536, 131072, ...
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY column_id
      ORDER BY position ASC, created_at ASC
    ) AS rn
  FROM cards
)
UPDATE cards
SET position = ranked.rn * 65536
FROM ranked
WHERE cards.id = ranked.id;
