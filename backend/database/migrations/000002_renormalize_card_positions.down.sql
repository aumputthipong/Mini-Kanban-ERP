-- ไม่สามารถ rollback ได้อย่างสมบูรณ์ เพราะค่าเดิมหายไปแล้ว
-- แค่ reset เป็น 1, 2, 3... ตามลำดับเพื่อให้ system ยังทำงานได้
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY column_id
      ORDER BY position ASC
    ) AS rn
  FROM cards
)
UPDATE cards
SET position = ranked.rn
FROM ranked
WHERE cards.id = ranked.id;
