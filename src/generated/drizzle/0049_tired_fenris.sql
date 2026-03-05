ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "color" varchar(24);--> statement-breakpoint
ALTER TABLE "user_preference" DROP COLUMN IF EXISTS "color";