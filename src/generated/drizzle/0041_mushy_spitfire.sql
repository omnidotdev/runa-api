ALTER TABLE "project" DROP CONSTRAINT "project_slug_organization_id_unique";--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "settings_organization_id_unique";--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_slug_organizationId_unique" UNIQUE("slug","organization_id");--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_organizationId_unique" UNIQUE("organization_id");