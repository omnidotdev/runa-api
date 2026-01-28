CREATE TABLE "agent_marketplace_listing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"install_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_persona" (
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
CREATE TABLE "agent_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"cron_expression" text NOT NULL,
	"instruction" text NOT NULL,
	"persona_id" uuid,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run_at" timestamp with time zone,
	"next_run_at" timestamp with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_webhook" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"event_type" text NOT NULL,
	"instruction_template" text NOT NULL,
	"signing_secret" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_config" ALTER COLUMN "model" SET DEFAULT 'anthropic/claude-sonnet-4.5';--> statement-breakpoint
ALTER TABLE "agent_activity" ADD COLUMN "snapshot_before" jsonb;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "encrypted_api_key" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "default_persona_id" uuid;--> statement-breakpoint
ALTER TABLE "agent_marketplace_listing" ADD CONSTRAINT "agent_marketplace_listing_persona_id_agent_persona_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."agent_persona"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_schedule" ADD CONSTRAINT "agent_schedule_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_schedule" ADD CONSTRAINT "agent_schedule_persona_id_agent_persona_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."agent_persona"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_webhook" ADD CONSTRAINT "agent_webhook_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_marketplace_listing_id_index" ON "agent_marketplace_listing" USING btree ("id");--> statement-breakpoint
CREATE INDEX "agent_marketplace_listing_category_idx" ON "agent_marketplace_listing" USING btree ("category");--> statement-breakpoint
CREATE INDEX "agent_marketplace_listing_organization_id_idx" ON "agent_marketplace_listing" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_marketplace_listing_persona_id_uniq" ON "agent_marketplace_listing" USING btree ("persona_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_persona_id_index" ON "agent_persona" USING btree ("id");--> statement-breakpoint
CREATE INDEX "agent_persona_organization_id_idx" ON "agent_persona" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_schedule_id_index" ON "agent_schedule" USING btree ("id");--> statement-breakpoint
CREATE INDEX "agent_schedule_organization_id_idx" ON "agent_schedule" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "agent_schedule_project_id_idx" ON "agent_schedule" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "agent_schedule_enabled_next_run_idx" ON "agent_schedule" USING btree ("enabled","next_run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_webhook_id_index" ON "agent_webhook" USING btree ("id");--> statement-breakpoint
CREATE INDEX "agent_webhook_organization_id_idx" ON "agent_webhook" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "agent_webhook_project_id_idx" ON "agent_webhook" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "agent_webhook_project_enabled_idx" ON "agent_webhook" USING btree ("project_id","enabled");--> statement-breakpoint
CREATE INDEX "agent_activity_project_created_idx" ON "agent_activity" USING btree ("project_id","created_at");--> statement-breakpoint
ALTER TABLE "agent_config" DROP COLUMN "provider";