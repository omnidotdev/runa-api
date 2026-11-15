ALTER TABLE "notification_preference" ADD COLUMN "email_task_comment" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preference" ADD COLUMN "email_task_mention" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_preference" ADD COLUMN "email_task_moved" boolean DEFAULT true NOT NULL;