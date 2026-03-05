import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { agentSessions } from "./agentSession.table";
import { projects } from "./project.table";
import { tasks } from "./task.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Task execution status.
 *
 * - `queued`: Waiting to start
 * - `running`: Agent is actively working
 * - `succeeded`: Completed with PR created
 * - `failed`: Execution errored out
 * - `cancelled`: Manually cancelled by user
 */
export type TaskExecutionStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

/**
 * Task execution metadata stored as JSONB.
 */
export interface TaskExecutionMetadata {
  model?: string;
  branchName?: string;
  prUrl?: string;
  prNumber?: number;
  errorMessage?: string;
  containerId?: string;
  stepCount?: number;
}

/**
 * Task execution table.
 *
 * Tracks the lifecycle of an autonomous code execution
 * triggered by assigning a task to the agent.
 */
export const taskExecutions = pgTable(
  "task_execution",
  {
    id: generateDefaultId(),
    organizationId: text().notNull(),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    taskId: uuid()
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    sessionId: uuid().references(() => agentSessions.id, {
      onDelete: "set null",
    }),
    /** User who triggered the execution. */
    triggeredBy: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: varchar({ length: 20 })
      .notNull()
      .default("queued")
      .$type<TaskExecutionStatus>(),
    /** Execution metadata (model, branch, PR info, errors). */
    metadata: jsonb().notNull().default({}).$type<TaskExecutionMetadata>(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("task_execution_organization_id_idx").on(table.organizationId),
    index("task_execution_project_id_idx").on(table.projectId),
    index("task_execution_task_id_idx").on(table.taskId),
    index("task_execution_status_idx").on(table.status),
  ],
);

export const taskExecutionRelations = relations(taskExecutions, ({ one }) => ({
  project: one(projects, {
    fields: [taskExecutions.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [taskExecutions.taskId],
    references: [tasks.id],
  }),
  session: one(agentSessions, {
    fields: [taskExecutions.sessionId],
    references: [agentSessions.id],
  }),
  triggeredByUser: one(users, {
    fields: [taskExecutions.triggeredBy],
    references: [users.id],
  }),
}));

export type InsertTaskExecution = InferInsertModel<typeof taskExecutions>;
export type SelectTaskExecution = InferSelectModel<typeof taskExecutions>;
