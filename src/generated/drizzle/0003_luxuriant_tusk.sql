CREATE TYPE "public"."project_status" AS ENUM('planned', 'in_progress', 'completed');--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "status" "project_status" DEFAULT 'planned' NOT NULL;