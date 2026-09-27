ALTER TABLE "checklist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "checklist_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "checklist" CASCADE;--> statement-breakpoint
DROP TABLE "checklist_item" CASCADE;--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_source_task_id_task_id_fk";
--> statement-breakpoint
DROP INDEX "task_source_task_id_index";--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "source_task_id";