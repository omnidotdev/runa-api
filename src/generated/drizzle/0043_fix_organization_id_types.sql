-- Fix organization_id column types from uuid to text to match IDP (Gatekeeper)
ALTER TABLE "project" ALTER COLUMN "organization_id" SET DATA TYPE text USING "organization_id"::text;--> statement-breakpoint
ALTER TABLE "project_column" ALTER COLUMN "organization_id" SET DATA TYPE text USING "organization_id"::text;
