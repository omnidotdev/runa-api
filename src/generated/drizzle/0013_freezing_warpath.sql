CREATE TABLE "invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitation_workspaceId_email_unique" UNIQUE("workspace_id","email")
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invitation_id_index" ON "invitation" USING btree ("id");--> statement-breakpoint
CREATE INDEX "invitation_workspace_id_index" ON "invitation" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_slug_index" ON "workspace" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_slug_workspaceId_unique" UNIQUE("slug","workspace_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_slug_unique" UNIQUE("slug");