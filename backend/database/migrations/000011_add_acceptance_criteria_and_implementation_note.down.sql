ALTER TABLE cards
    DROP COLUMN IF EXISTS implementation_note,
    DROP COLUMN IF EXISTS acceptance_criteria;

ALTER TABLE planning_items
    DROP COLUMN IF EXISTS implementation_note,
    DROP COLUMN IF EXISTS acceptance_criteria;
