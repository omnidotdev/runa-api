ALTER TABLE "task" ADD COLUMN "project_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_author_id_index" ON "task" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "task_project_id_index" ON "task" USING btree ("project_id");