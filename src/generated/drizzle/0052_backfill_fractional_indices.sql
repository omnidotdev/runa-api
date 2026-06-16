-- Backfill the new text ordering columns with valid fractional-indexing keys.
-- A helper function converts a 0-based ordinal into a length-3 base-62 key.
-- Header letter `c` indicates positive integer-part length 3, so each
-- partition gets up to 238,328 (62^3) seed slots; the library accepts
-- any well-formed key for future generateKeyBetween calls.

CREATE OR REPLACE FUNCTION public.fi_seed_key(n integer) RETURNS text AS $$
DECLARE
  alphabet text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
BEGIN
  IF n < 0 OR n > 238327 THEN
    RAISE EXCEPTION 'fi_seed_key out of range: %', n;
  END IF;

  RETURN 'c'
      || substr(alphabet, (n / 3844) + 1, 1)
      || substr(alphabet, ((n / 62) % 62) + 1, 1)
      || substr(alphabet, (n % 62) + 1, 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
--> statement-breakpoint

WITH ranked AS (
  SELECT id, public.fi_seed_key(
    (ROW_NUMBER() OVER (
      PARTITION BY column_id
      ORDER BY column_index, created_at, id
    ) - 1)::int
  ) AS key
  FROM "task"
)
UPDATE "task" SET column_index_text = ranked.key
FROM ranked WHERE "task".id = ranked.id;
--> statement-breakpoint

WITH ranked AS (
  SELECT id, public.fi_seed_key(
    (ROW_NUMBER() OVER (
      PARTITION BY project_id
      ORDER BY "index", created_at, id
    ) - 1)::int
  ) AS key
  FROM "column"
)
UPDATE "column" SET "index_text" = ranked.key
FROM ranked WHERE "column".id = ranked.id;
--> statement-breakpoint

WITH ranked AS (
  SELECT id, public.fi_seed_key(
    (ROW_NUMBER() OVER (
      PARTITION BY project_column_id
      ORDER BY column_index, created_at, id
    ) - 1)::int
  ) AS key
  FROM "project"
)
UPDATE "project" SET column_index_text = ranked.key
FROM ranked WHERE "project".id = ranked.id;
--> statement-breakpoint

WITH ranked AS (
  SELECT id, public.fi_seed_key(
    (ROW_NUMBER() OVER (
      PARTITION BY organization_id
      ORDER BY "index", created_at, id
    ) - 1)::int
  ) AS key
  FROM "project_column"
)
UPDATE "project_column" SET "index_text" = ranked.key
FROM ranked WHERE "project_column".id = ranked.id;
--> statement-breakpoint

DROP FUNCTION public.fi_seed_key(integer);
