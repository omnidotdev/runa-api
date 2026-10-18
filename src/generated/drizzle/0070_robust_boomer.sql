ALTER TABLE "calendar_feed_token" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_feed_token" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "calendar_feed_token" ADD CONSTRAINT "calendar_feed_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_feed_token_user_id_idx" ON "calendar_feed_token" USING btree ("user_id");