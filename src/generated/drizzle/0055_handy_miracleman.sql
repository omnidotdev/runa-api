CREATE TABLE "repo_execution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_execution_id" uuid NOT NULL,
	"repo" text NOT NULL,
	"branch" text,
	"pr_url" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"order" integer DEFAULT 1 NOT NULL,
	"error_log" text,
	"started_at" timestamp(6) with time zone,
	"completed_at" timestamp(6) with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_execution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"error_log" text,
	"started_at" timestamp(6) with time zone,
	"completed_at" timestamp(6) with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repo_execution" ADD CONSTRAINT "repo_execution_task_execution_id_task_execution_id_fk" FOREIGN KEY ("task_execution_id") REFERENCES "public"."task_execution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "repo_execution_id_index" ON "repo_execution" USING btree ("id");--> statement-breakpoint
CREATE INDEX "repo_execution_task_execution_id_index" ON "repo_execution" USING btree ("task_execution_id");--> statement-breakpoint
CREATE INDEX "repo_execution_status_index" ON "repo_execution" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "task_execution_id_index" ON "task_execution" USING btree ("id");--> statement-breakpoint
CREATE INDEX "task_execution_task_id_index" ON "task_execution" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_execution_status_index" ON "task_execution" USING btree ("status");