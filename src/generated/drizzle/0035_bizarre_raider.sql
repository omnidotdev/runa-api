ALTER TABLE "workspace" RENAME TO "settings";--> statement-breakpoint
ALTER TABLE "project" RENAME COLUMN "workspace_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "project_column" RENAME COLUMN "workspace_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "project_slug_workspaceId_unique";--> statement-breakpoint
ALTER TABLE "settings" DROP CONSTRAINT "workspace_organization_id_unique";--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "project_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "project_column" DROP CONSTRAINT "project_column_workspace_id_workspace_id_fk";
--> statement-breakpoint
DROP INDEX "project_workspace_id_index";--> statement-breakpoint
DROP INDEX "project_column_workspace_id_index";--> statement-breakpoint
DROP INDEX "project_column_workspace_id_index_index";--> statement-breakpoint
DROP INDEX "workspace_id_index";--> statement-breakpoint
DROP INDEX "workspace_organization_id_idx";--> statement-breakpoint
CREATE INDEX "project_organization_id_idx" ON "project" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_column_organization_id_idx" ON "project_column" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "project_column_organization_id_index_index" ON "project_column" USING btree ("organization_id","index");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_id_index" ON "settings" USING btree ("id");--> statement-breakpoint
CREATE INDEX "settings_organization_id_idx" ON "settings" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_slug_organization_id_unique" UNIQUE("slug","organization_id");--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_organization_id_unique" UNIQUE("organization_id");