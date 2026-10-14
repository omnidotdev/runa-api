CREATE TABLE "calendar_feed_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_by" text NOT NULL,
	"last_used_at" timestamp(6) with time zone,
	"revoked_at" timestamp(6) with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_feed_token" ADD CONSTRAINT "calendar_feed_token_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_feed_token_token_hash_idx" ON "calendar_feed_token" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "calendar_feed_token_project_id_idx" ON "calendar_feed_token" USING btree ("project_id");