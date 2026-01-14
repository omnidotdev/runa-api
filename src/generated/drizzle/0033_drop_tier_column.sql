-- Drop the deprecated tier column from workspace table
-- Tier is now managed by Aether at the organization level
ALTER TABLE "workspace" DROP COLUMN IF EXISTS "tier";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."tier";
