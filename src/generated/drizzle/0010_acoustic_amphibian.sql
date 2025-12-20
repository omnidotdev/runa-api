ALTER TABLE "user_preference" ADD COLUMN "view_mode" varchar(10) DEFAULT 'board' NOT NULL;--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "view_mode";