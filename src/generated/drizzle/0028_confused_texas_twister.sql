ALTER TYPE "public"."tier" ADD VALUE 'enterprise';--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "subscription_id" text;