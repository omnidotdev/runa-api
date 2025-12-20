CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
ALTER TABLE "workspace_user" ADD COLUMN "role" "role" DEFAULT 'member' NOT NULL;