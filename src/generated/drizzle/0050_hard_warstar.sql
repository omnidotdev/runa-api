CREATE TABLE IF NOT EXISTS "agent_activity" (
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
	"snapshot_before" jsonb,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"model" text DEFAULT 'anthropic/claude-haiku-4.5' NOT NULL,
	"encrypted_api_key" text,
	"enabled" boolean DEFAULT false NOT NULL,
	"max_iterations_per_request" integer DEFAULT 10 NOT NULL,
	"require_approval_for_destructive" boolean DEFAULT true NOT NULL,
	"require_approval_for_create" boolean DEFAULT false NOT NULL,
	"custom_instructions" text,
	"default_persona_id" uuid,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_config_organizationId_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_persona" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"icon" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agent_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid,
	"user_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'project_chat' NOT NULL,
	"title" text,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tool_call_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN IF NOT EXISTS "parent_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "agent_activity" ADD CONSTRAINT "agent_activity_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "agent_activity" ADD CONSTRAINT "agent_activity_session_id_agent_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."agent_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "agent_activity" ADD CONSTRAINT "agent_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "agent_session" ADD CONSTRAINT "agent_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_activity_id_index" ON "agent_activity" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_activity_organization_id_idx" ON "agent_activity" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_activity_project_id_idx" ON "agent_activity" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_activity_session_id_idx" ON "agent_activity" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_activity_user_id_idx" ON "agent_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_activity_tool_name_idx" ON "agent_activity" USING btree ("tool_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_activity_project_created_idx" ON "agent_activity" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_config_id_index" ON "agent_config" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_config_organization_id_idx" ON "agent_config" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_persona_id_index" ON "agent_persona" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_persona_organization_id_idx" ON "agent_persona" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_session_id_index" ON "agent_session" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_session_organization_id_idx" ON "agent_session" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_session_project_id_idx" ON "agent_session" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_session_user_id_idx" ON "agent_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_session_user_project_idx" ON "agent_session" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_session_type_idx" ON "agent_session" USING btree ("type");--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "post" ADD CONSTRAINT "post_parent_id_post_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "post_parent_id_index" ON "post" USING btree ("parent_id");
