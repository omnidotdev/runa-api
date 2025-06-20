CREATE TABLE "assignee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now(),
	"deleted_at" timestamp(6) with time zone
);
--> statement-breakpoint
CREATE TABLE "column" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"description" text,
	"author_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"prefix" varchar(10),
	"color" varchar(20),
	"labels" jsonb,
	"workspace_id" uuid NOT NULL,
	"view_mode" varchar(10) DEFAULT 'board' NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"description" text NOT NULL,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"author_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"column_id" uuid NOT NULL,
	"labels" jsonb DEFAULT '[]'::jsonb,
	"due_date" timestamp(6) with time zone,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_provider_id" uuid NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now(),
	CONSTRAINT "user_identityProviderId_unique" UNIQUE("identity_provider_id")
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	"updated_at" timestamp(6) with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workspace_user" (
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now(),
	CONSTRAINT "workspace_user_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "assignee" ADD CONSTRAINT "assignee_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignee" ADD CONSTRAINT "assignee_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "column" ADD CONSTRAINT "column_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_column_id_column_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."column"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_user" ADD CONSTRAINT "workspace_user_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_user" ADD CONSTRAINT "workspace_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignee_id_index" ON "assignee" USING btree ("id");--> statement-breakpoint
CREATE INDEX "assignee_user_id_index" ON "assignee" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assignee_task_id_index" ON "assignee" USING btree ("task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "column_id_index" ON "column" USING btree ("id");--> statement-breakpoint
CREATE INDEX "column_project_id_index" ON "column" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_id_index" ON "post" USING btree ("id");--> statement-breakpoint
CREATE INDEX "post_author_id_index" ON "post" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "post_task_id_index" ON "post" USING btree ("task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_id_index" ON "project" USING btree ("id");--> statement-breakpoint
CREATE INDEX "project_workspace_id_index" ON "project" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_id_index" ON "task" USING btree ("id");--> statement-breakpoint
CREATE INDEX "task_column_id_index" ON "task" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "task_project_id_index" ON "task" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_id_index" ON "user" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_identity_provider_id_index" ON "user" USING btree ("identity_provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_id_index" ON "workspace" USING btree ("id");--> statement-breakpoint
CREATE INDEX "workspace_user_user_id_index" ON "workspace_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_user_workspace_id_index" ON "workspace_user" USING btree ("workspace_id");