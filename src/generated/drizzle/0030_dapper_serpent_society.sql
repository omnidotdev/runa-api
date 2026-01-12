ALTER TABLE "workspace" DROP CONSTRAINT "workspace_slug_unique";--> statement-breakpoint
ALTER TABLE "workspace" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "workspace" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_organization_id_unique" UNIQUE("organization_id");