-- Switch the four ordering columns to COLLATE "C" so Postgres ORDER BY
-- uses byte-order lex comparison instead of locale-aware (en_US.UTF-8)
-- collation. The fractional-indexing library produces keys (e.g. `Zz`,
-- `a0`, `a0V`) whose ordering only holds under byte comparison; the
-- default DB collation reorders uppercase relative to lowercase and
-- breaks insertion semantics.

ALTER TABLE "task" ALTER COLUMN "column_index" TYPE text COLLATE "C";--> statement-breakpoint
ALTER TABLE "column" ALTER COLUMN "index" TYPE text COLLATE "C";--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "column_index" TYPE text COLLATE "C";--> statement-breakpoint
ALTER TABLE "project_column" ALTER COLUMN "index" TYPE text COLLATE "C";
