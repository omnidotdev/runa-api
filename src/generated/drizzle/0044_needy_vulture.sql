CREATE TABLE "project_label" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"icon" text,
	"organization_id" text NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_project_label" (
	"project_id" uuid NOT NULL,
	"project_label_id" uuid NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_project_label_project_id_project_label_id_pk" PRIMARY KEY("project_id","project_label_id"),
	CONSTRAINT "project_project_label_projectId_projectLabelId_unique" UNIQUE("project_id","project_label_id")
);
--> statement-breakpoint
ALTER TABLE "label" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "label" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "label" ADD COLUMN "organization_id" text;--> statement-breakpoint
ALTER TABLE "project_project_label" ADD CONSTRAINT "project_project_label_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_project_label" ADD CONSTRAINT "project_project_label_project_label_id_project_label_id_fk" FOREIGN KEY ("project_label_id") REFERENCES "public"."project_label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_label_id_index" ON "project_label" USING btree ("id");--> statement-breakpoint
CREATE INDEX "project_label_organization_id_index" ON "project_label" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_label_org_name_unique" ON "project_label" USING btree ("organization_id","name");--> statement-breakpoint
CREATE INDEX "project_project_label_project_id_index" ON "project_project_label" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_project_label_project_label_id_index" ON "project_project_label" USING btree ("project_label_id");--> statement-breakpoint
CREATE INDEX "label_organization_id_index" ON "label" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "label_org_name_unique" ON "label" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "label_project_name_unique" ON "label" USING btree ("project_id","name");