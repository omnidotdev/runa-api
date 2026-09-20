CREATE TABLE "notification_digest_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"send_after" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_preference" ADD COLUMN "task_assigned_cadence" text DEFAULT 'immediate' NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_digest_queue" ADD CONSTRAINT "notification_digest_queue_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_digest_queue_user_idx" ON "notification_digest_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_digest_queue_send_after_idx" ON "notification_digest_queue" USING btree ("send_after");