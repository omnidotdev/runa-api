ALTER TABLE "workspace" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "deletion_reason" text;