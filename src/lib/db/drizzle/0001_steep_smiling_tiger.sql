ALTER TABLE "task" DROP CONSTRAINT "task_project_id_project_id_fk";
--> statement-breakpoint
DROP INDEX "task_project_id_index";--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "project_id";