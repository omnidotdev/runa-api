ALTER TABLE "post" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_parent_id_post_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "post_parent_id_index" ON "post" USING btree ("parent_id");