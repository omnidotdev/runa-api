import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { posts } from "./post.table";
import { tasks } from "./task.table";
import { users } from "./user.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Derived media metadata for an attachment (thumbnails, blur-up placeholder).
 * Populated server-side at upload time for images.
 */
export type AttachmentMetadata = {
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  /** Low-quality image placeholder as a base64 data URI, for blur-up loading */
  lqip?: string;
};

/**
 * Attachment table.
 *
 * Backs both the task-level attachments section and inline images pasted into
 * the description/comment editors. Every attachment belongs to exactly one task
 * (`taskId`); `postId` is set only when the file was dropped into a specific
 * comment. The owning bytes live in object storage at `storageKey`.
 */
export const attachments = pgTable(
  "attachment",
  {
    id: generateDefaultId(),
    // Owning task; cascade so attachments disappear with their task
    taskId: uuid()
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    // Set when dropped into a specific comment, null = task-level / description
    postId: uuid().references(() => posts.id, { onDelete: "cascade" }),
    // Uploader; survives user deletion so the file stays on the task
    authorId: uuid().references(() => users.id, { onDelete: "set null" }),
    // Denormalized for org-scoped storage accounting and authz model parity
    organizationId: text().notNull(),
    filename: text().notNull(),
    mimeType: text().notNull(),
    fileSize: integer().notNull(),
    // "image" | "video" | "file"; drives client rendering, validated app-side
    kind: text().notNull(),
    // Path within the bucket, used for serving and deletion
    storageKey: text().notNull(),
    // Proxied URL the client loads (routes through /api/attachments/file/*)
    url: text().notNull(),
    // Intrinsic dimensions when known (images/video)
    width: integer(),
    height: integer(),
    // Thumbnail + blur-up placeholder, mirrors the media providers' shape
    metadata: jsonb().$type<AttachmentMetadata>().default({}),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index().on(table.taskId),
    index().on(table.postId),
    index().on(table.organizationId),
  ],
);

export const attachmentRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, {
    fields: [attachments.taskId],
    references: [tasks.id],
  }),
  post: one(posts, {
    fields: [attachments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [attachments.authorId],
    references: [users.id],
  }),
}));

export type InsertAttachment = InferInsertModel<typeof attachments>;
export type SelectAttachment = InferSelectModel<typeof attachments>;
