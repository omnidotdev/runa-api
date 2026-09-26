CREATE TABLE "checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" text NOT NULL,
	"index" text NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_done" boolean DEFAULT false NOT NULL,
	"index" text NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "source_task_id" uuid;--> statement-breakpoint
ALTER TABLE "checklist" ADD CONSTRAINT "checklist_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_item" ADD CONSTRAINT "checklist_item_checklist_id_checklist_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_id_index" ON "checklist" USING btree ("id");--> statement-breakpoint
CREATE INDEX "checklist_task_id_index" ON "checklist" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "checklist_task_id_index_index" ON "checklist" USING btree ("task_id","index");--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_item_id_index" ON "checklist_item" USING btree ("id");--> statement-breakpoint
CREATE INDEX "checklist_item_checklist_id_index" ON "checklist_item" USING btree ("checklist_id");--> statement-breakpoint
CREATE INDEX "checklist_item_checklist_id_index_index" ON "checklist_item" USING btree ("checklist_id","index");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_source_task_id_task_id_fk" FOREIGN KEY ("source_task_id") REFERENCES "public"."task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_source_task_id_index" ON "task" USING btree ("source_task_id");