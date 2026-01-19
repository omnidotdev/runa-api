ALTER TABLE "project" ADD COLUMN "next_task_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "number" integer;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_project_number_unique" UNIQUE("project_id","number");