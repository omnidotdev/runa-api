CREATE TABLE "webhook_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint_id" uuid NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 6 NOT NULL,
	"last_error" text,
	"next_retry_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp(6) with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"event_types" text[],
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "webhook_delivery_next_retry_idx" ON "webhook_delivery" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "webhook_delivery_endpoint_id_idx" ON "webhook_delivery" USING btree ("endpoint_id");--> statement-breakpoint
CREATE INDEX "webhook_endpoint_organization_id_idx" ON "webhook_endpoint" USING btree ("organization_id");