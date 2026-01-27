CREATE TABLE "agent_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"tool_name" text NOT NULL,
	"tool_input" jsonb NOT NULL,
	"tool_output" jsonb,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"approval_status" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"error_message" text,
	"affected_task_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"provider" text DEFAULT 'anthropic' NOT NULL,
	"model" text DEFAULT 'claude-sonnet-4-5' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"max_iterations_per_request" integer DEFAULT 10 NOT NULL,
	"require_approval_for_destructive" boolean DEFAULT true NOT NULL,
	"require_approval_for_create" boolean DEFAULT false NOT NULL,
	"custom_instructions" text,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_config_organizationId_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "agent_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"tool_call_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_activity" ADD CONSTRAINT "agent_activity_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_activity" ADD CONSTRAINT "agent_activity_session_id_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_activity" ADD CONSTRAINT "agent_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_activity_id_index" ON "agent_activity" USING btree ("id");--> statement-breakpoint
CREATE INDEX "agent_activity_organization_id_idx" ON "agent_activity" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "agent_activity_project_id_idx" ON "agent_activity" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "agent_activity_session_id_idx" ON "agent_activity" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "agent_activity_user_id_idx" ON "agent_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_activity_tool_name_idx" ON "agent_activity" USING btree ("tool_name");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_config_id_index" ON "agent_config" USING btree ("id");--> statement-breakpoint
CREATE INDEX "agent_config_organization_id_idx" ON "agent_config" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_session_id_index" ON "agent_session" USING btree ("id");--> statement-breakpoint
CREATE INDEX "agent_session_organization_id_idx" ON "agent_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "agent_session_project_id_idx" ON "agent_session" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "agent_session_user_id_idx" ON "agent_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_session_user_project_idx" ON "agent_session" USING btree ("user_id","project_id");