CREATE TABLE "emoji" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emoji" text,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emoji" ADD CONSTRAINT "emoji_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emoji" ADD CONSTRAINT "emoji_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "emoji_id_index" ON "emoji" USING btree ("id");--> statement-breakpoint
CREATE INDEX "emoji_post_id_index" ON "emoji" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "emoji_user_id_index" ON "emoji" USING btree ("user_id");