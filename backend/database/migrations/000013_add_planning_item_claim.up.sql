-- Claim / Working state — a soft "I'm looking at this" flag on planning
-- items. Lets a dev call dibs on an item so two people don't both start
-- drafting acceptance criteria for the same row in parallel.
--
-- Nullable claimed_by + claimed_at: NULL means "free". ON DELETE SET NULL
-- on the user FK so deleting a user (or removing them from the board)
-- releases their claims automatically — we don't want a deactivated
-- account to permanently block an item.
--
-- No partial index here yet: the column is only consulted on the item's
-- own row (get item by id), and the table is small enough that a full
-- scan for "all my claims" would still be fast. Add an index later if a
-- "my claimed items" view shows up.
ALTER TABLE planning_items
    ADD COLUMN claimed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN claimed_at         TIMESTAMPTZ;
