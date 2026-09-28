/**
 * Task attachment delete route.
 *
 * Attachment writes go through REST (not GraphQL) so storage and database stay
 * in sync. This authorizes the caller against the attachment's project, removes
 * the object (and its thumbnail) from storage, and deletes the row.
 */

import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { checkPermission } from "lib/authz";
import { protectRoutes } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { attachments, tasks, users } from "lib/db/schema";
import { buildResourceEvent } from "lib/events/resourceEvent";
import { events, storage } from "lib/providers";
import { resolveSubject, thumbnailKeyFor } from "./util";

const attachmentDeleteRoutes = new Elysia({
  prefix: "/api/attachments",
}).delete("/:id", async ({ params, request, set }) => {
  const { sub, token } = await resolveSubject(
    request.headers.get("authorization"),
  );

  if (!sub && protectRoutes) {
    set.status = 401;
    return { error: "Unauthorized" };
  }

  const [row] = await dbPool
    .select({
      id: attachments.id,
      storageKey: attachments.storageKey,
      kind: attachments.kind,
      organizationId: attachments.organizationId,
      taskId: attachments.taskId,
      postId: attachments.postId,
      filename: attachments.filename,
      projectId: tasks.projectId,
    })
    .from(attachments)
    .innerJoin(tasks, eq(attachments.taskId, tasks.id))
    .where(eq(attachments.id, params.id))
    .limit(1);

  if (!row) {
    set.status = 404;
    return { error: "Attachment not found" };
  }

  if (sub) {
    const allowed = await checkPermission(
      sub,
      "project",
      row.projectId,
      "editor",
      token ?? "",
    );
    if (!allowed) {
      set.status = 403;
      return { error: "Forbidden" };
    }
  }

  // Remove the DB row first; storage cleanup is best-effort afterwards so a
  // storage hiccup never leaves an undeletable record
  await dbPool.delete(attachments).where(eq(attachments.id, row.id));

  try {
    await storage.delete(row.storageKey);
    if (row.kind === "image") {
      await storage.delete(thumbnailKeyFor(row.storageKey));
    }
  } catch (error) {
    console.warn("[Attachments] Storage cleanup failed:", error);
  }

  // Task-scoped so it lands in the task's activity feed ("removed <file>"). Skip
  // comment-inline drops (postId set), matching the upload route, so the timeline
  // does not double up on comment attachments.
  if (row.postId == null) {
    const actor = sub
      ? await dbPool.query.users.findFirst({
          where: eq(users.identityProviderId, sub),
        })
      : undefined;

    void events
      .emit(
        buildResourceEvent(
          {
            entity: "attachment",
            action: "deleted",
            nameColumn: "filename",
            orgVia: "direct",
          },
          row.taskId,
          row,
          actor ?? null,
          [{ field: "attachments", label: `removed ${row.filename}` }],
        ),
      )
      .catch((error: unknown) => {
        console.warn("[Attachments] Event emit failed:", error);
      });
  }

  set.status = 200;
  return { success: true };
});

export default attachmentDeleteRoutes;
