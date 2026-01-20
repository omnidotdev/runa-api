CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('personal', 'team');--> statement-breakpoint
CREATE TABLE "user_organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text,
	"type" "organization_type" DEFAULT 'team' NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"synced_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(6) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_organization_userId_organizationId_unique" UNIQUE("user_id","organization_id")
);
--> statement-breakpoint
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_organization_id_index" ON "user_organization" USING btree ("id");--> statement-breakpoint
CREATE INDEX "user_organization_user_id_index" ON "user_organization" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_organization_organization_id_index" ON "user_organization" USING btree ("organization_id");