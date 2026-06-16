-- Cutover from integer ordering columns to fractional-indexing text columns.
-- ALTER COLUMN SET DATA TYPE text USING <text_companion> pulls the backfilled
-- fractional keys from migration B into the original column. PostgreSQL
-- automatically rebuilds dependent composite indexes against the new type
-- (the index name stays identical, only the underlying type changes).

ALTER TABLE "task" ALTER COLUMN "column_index" SET DATA TYPE text USING "column_index_text";--> statement-breakpoint
ALTER TABLE "task" ALTER COLUMN "column_index" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "column_index_text";--> statement-breakpoint

ALTER TABLE "column" ALTER COLUMN "index" SET DATA TYPE text USING "index_text";--> statement-breakpoint
ALTER TABLE "column" ALTER COLUMN "index" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "column" DROP COLUMN "index_text";--> statement-breakpoint

ALTER TABLE "project_column" ALTER COLUMN "index" SET DATA TYPE text USING "index_text";--> statement-breakpoint
ALTER TABLE "project_column" ALTER COLUMN "index" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "project_column" DROP COLUMN "index_text";--> statement-breakpoint

ALTER TABLE "project" ALTER COLUMN "column_index" SET DATA TYPE text USING "column_index_text";--> statement-breakpoint
ALTER TABLE "project" ALTER COLUMN "column_index" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "column_index_text";--> statement-breakpoint

CREATE INDEX "project_project_column_id_column_index_index" ON "project" USING btree ("project_column_id","column_index");
