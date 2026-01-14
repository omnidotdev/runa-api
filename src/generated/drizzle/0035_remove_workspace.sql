-- Migration: Remove workspace table, rename to settings
-- Projects and project_columns now reference organization_id directly

-- Step 1: Add organization_id to project table
ALTER TABLE "project" ADD COLUMN "organization_id" TEXT;

-- Step 2: Backfill organization_id from workspace table
UPDATE "project" SET "organization_id" = (
  SELECT "organization_id" FROM "workspace" WHERE "workspace"."id" = "project"."workspace_id"
);

-- Step 3: Make organization_id NOT NULL
ALTER TABLE "project" ALTER COLUMN "organization_id" SET NOT NULL;

-- Step 4: Add organization_id to project_column table
ALTER TABLE "project_column" ADD COLUMN "organization_id" TEXT;

-- Step 5: Backfill organization_id from workspace table
UPDATE "project_column" SET "organization_id" = (
  SELECT "organization_id" FROM "workspace" WHERE "workspace"."id" = "project_column"."workspace_id"
);

-- Step 6: Make organization_id NOT NULL
ALTER TABLE "project_column" ALTER COLUMN "organization_id" SET NOT NULL;

-- Step 7: Drop workspace_id foreign key from project
ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "project_workspace_id_workspace_id_fk";
ALTER TABLE "project" DROP COLUMN "workspace_id";

-- Step 8: Drop workspace_id foreign key from project_column
ALTER TABLE "project_column" DROP CONSTRAINT IF EXISTS "project_column_workspace_id_workspace_id_fk";
ALTER TABLE "project_column" DROP COLUMN "workspace_id";

-- Step 9: Rename workspace table to settings
ALTER TABLE "workspace" RENAME TO "settings";

-- Step 10: Rename indexes
ALTER INDEX IF EXISTS "workspace_organization_id_idx" RENAME TO "settings_organization_id_idx";

-- Step 11: Add new indexes for organization_id on project and project_column
CREATE INDEX IF NOT EXISTS "project_organization_id_idx" ON "project" ("organization_id");
CREATE INDEX IF NOT EXISTS "project_column_organization_id_idx" ON "project_column" ("organization_id");

-- Step 12: Update unique constraint on project (slug + organization_id instead of workspace_id)
ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "project_slug_workspace_id_unique";
ALTER TABLE "project" ADD CONSTRAINT "project_slug_organization_id_unique" UNIQUE ("slug", "organization_id");
