ALTER TABLE "user_organization" DROP CONSTRAINT "user_organization_userId_organizationId_unique";--> statement-breakpoint
ALTER TABLE "user_organization" ALTER COLUMN "organization_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_organization" ADD CONSTRAINT "user_organization_userId_organization_id_unique" UNIQUE("user_id","organization_id");