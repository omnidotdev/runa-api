ALTER TABLE "agent_session" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_session" ADD COLUMN "type" varchar(20) DEFAULT 'project_chat' NOT NULL;--> statement-breakpoint
CREATE INDEX "agent_session_type_idx" ON "agent_session" USING btree ("type");