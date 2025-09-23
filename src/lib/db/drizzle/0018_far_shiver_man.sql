CREATE TYPE "public"."tier" AS ENUM('free', 'basic', 'team');--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "tier" "tier" DEFAULT 'free' NOT NULL;