-- Give existing workspaces' project-status columns the moon-phase icons that the
-- board's default task columns already use, and fix the missing `emoji:` provider
-- prefix (a bare emoji renders nothing in the client icon parser).
--
-- Conservative by design: each row is only updated when it still matches BOTH the
-- old default title AND the old bare-emoji icon, so any column a user renamed or
-- re-iconed is left untouched.

UPDATE "project_column" SET "icon" = 'emoji:🌒' WHERE "title" = 'Planned' AND "icon" = '🗓';--> statement-breakpoint
UPDATE "project_column" SET "icon" = 'emoji:🌓' WHERE "title" = 'In Progress' AND "icon" = '🚧';--> statement-breakpoint
UPDATE "project_column" SET "icon" = 'emoji:🌕' WHERE "title" = 'Completed' AND "icon" = '✅';
