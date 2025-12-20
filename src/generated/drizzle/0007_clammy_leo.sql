CREATE TABLE "label" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_label" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_label" ADD CONSTRAINT "task_label_label_id_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "label_id_index" ON "label" USING btree ("id");--> statement-breakpoint
CREATE INDEX "label_project_id_index" ON "label" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "label_name_index" ON "label" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "task_label_id_index" ON "task_label" USING btree ("id");--> statement-breakpoint
CREATE INDEX "task_label_task_id_index" ON "task_label" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_label_label_id_index" ON "task_label" USING btree ("label_id");--> statement-breakpoint
ALTER TABLE "project" DROP COLUMN "labels";--> statement-breakpoint
ALTER TABLE "task" DROP COLUMN "labels";