-- 1. Drop indexes on id columns first
DROP INDEX "assignee_id_index";--> statement-breakpoint
DROP INDEX "task_label_id_index";--> statement-breakpoint

-- 2. Drop the id columns (this removes old PKs)
ALTER TABLE "assignee" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "task_label" DROP COLUMN "id";--> statement-breakpoint

-- 3. Add new composite primary keys
ALTER TABLE "assignee" ADD CONSTRAINT "assignee_task_id_user_id_pk" PRIMARY KEY("task_id","user_id");--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_task_id_label_id_pk" PRIMARY KEY("task_id","label_id");--> statement-breakpoint

-- 4. Add unique constraints
ALTER TABLE "assignee" ADD CONSTRAINT "assignee_task_id_user_id_unique" UNIQUE("task_id","user_id");--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_task_id_label_id_unique" UNIQUE("task_id","label_id");--> statement-breakpoint

-- 5. Add ordering indexes
CREATE INDEX "column_project_id_index_index" ON "column" USING btree ("project_id","index");--> statement-breakpoint
CREATE INDEX "project_column_workspace_id_index_index" ON "project_column" USING btree ("workspace_id","index");--> statement-breakpoint
CREATE INDEX "task_column_id_column_index_index" ON "task" USING btree ("column_id","column_index");--> statement-breakpoint

-- 6. Add updatedAt to workspace_user
ALTER TABLE "workspace_user" ADD COLUMN "updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL;
