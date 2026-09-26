CREATE TABLE "link_unfurl" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"url_hash" text NOT NULL,
	"status" text NOT NULL,
	"title" text,
	"description" text,
	"image_url" text,
	"favicon_data_uri" text,
	"fetched_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "link_unfurl_id_index" ON "link_unfurl" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX "link_unfurl_url_hash_unique" ON "link_unfurl" USING btree ("url_hash");--> statement-breakpoint
CREATE INDEX "link_unfurl_fetched_at_index" ON "link_unfurl" USING btree ("fetched_at");