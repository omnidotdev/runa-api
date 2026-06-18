CREATE TABLE "attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"post_id" uuid,
	"author_id" uuid,
	"organization_id" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"width" integer,
	"height" integer,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attachment_id_index" ON "attachment" USING btree ("id");--> statement-breakpoint
CREATE INDEX "attachment_task_id_index" ON "attachment" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "attachment_post_id_index" ON "attachment" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "attachment_organization_id_index" ON "attachment" USING btree ("organization_id");