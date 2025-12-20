ALTER TABLE "project" ADD COLUMN "column_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "project_project_column_id_index" ON "project" USING btree ("project_column_id");