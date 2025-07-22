CREATE TABLE "project_column" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emoji" text,
	"title" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"hidden_column_ids" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "column" ADD COLUMN "emoji" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "project_column_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "project_column" ADD CONSTRAINT "project_column_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_column_id_index" ON "project_column" USING btree ("id");--> statement-breakpoint
CREATE INDEX "project_column_workspace_id_index" ON "project_column" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_preference_id_index" ON "user_preference" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_preference_user_id_index" ON "user_preference" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_project_column_id_project_column_id_fk" FOREIGN KEY ("project_column_id") REFERENCES "public"."project_column"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."project_status";