ALTER TABLE "workspace_user" RENAME TO "member";--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "workspace_user_workspace_id_workspace_id_fk";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "workspace_user_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "workspace_slug_idx";--> statement-breakpoint
DROP INDEX "workspace_user_user_id_index";--> statement-breakpoint
DROP INDEX "workspace_user_workspace_id_index";--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "workspace_user_workspace_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id");--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_user_id_index" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "member_workspace_id_index" ON "member" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_slug_unique" UNIQUE("slug");