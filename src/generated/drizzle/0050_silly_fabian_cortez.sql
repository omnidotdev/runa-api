CREATE TABLE "github_installation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"installation_id" integer NOT NULL,
	"github_org_login" text NOT NULL,
	"github_org_id" integer NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"repo_full_name" text NOT NULL,
	"repo_id" integer NOT NULL,
	"default_branch" text DEFAULT 'main' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_execution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"session_id" uuid,
	"triggered_by" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_repository" ADD CONSTRAINT "github_repository_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_session_id_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_triggered_by_user_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_installation_id_index" ON "github_installation" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_installation_organization_id_unique" ON "github_installation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "github_installation_installation_id_idx" ON "github_installation" USING btree ("installation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_repository_id_index" ON "github_repository" USING btree ("id");--> statement-breakpoint
CREATE INDEX "github_repository_organization_id_idx" ON "github_repository" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_repository_project_id_unique" ON "github_repository" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "github_repository_repo_full_name_idx" ON "github_repository" USING btree ("repo_full_name");--> statement-breakpoint
CREATE UNIQUE INDEX "task_execution_id_index" ON "task_execution" USING btree ("id");--> statement-breakpoint
CREATE INDEX "task_execution_organization_id_idx" ON "task_execution" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "task_execution_project_id_idx" ON "task_execution" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "task_execution_task_id_idx" ON "task_execution" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_execution_status_idx" ON "task_execution" USING btree ("status");