ALTER TABLE "project" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_slug_index" ON "workspace" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_slug_workspaceId_unique" UNIQUE("slug","workspace_id");--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_slug_unique" UNIQUE("slug");