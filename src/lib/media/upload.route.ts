/**
 * Task attachment upload route.
 *
 * Accepts a single multipart file plus the target `taskId` (and optional
 * `postId` when the file was dropped into a comment), authorizes the uploader
 * against the task's project, enforces per-org storage limits, derives image
 * thumbnails/placeholders, writes the bytes to object storage, and persists the
 * `attachment` row. Returns the created record.
 */

import { createHash } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import sharp from "sharp";

import { checkPermission } from "lib/authz";
import { protectRoutes } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { attachments, projects, tasks, users } from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements";
import {
  FEATURE_KEYS,
  billingBypassOrgIds,
} from "lib/graphql/plugins/authorization/constants";
import { events, storage } from "lib/providers";
import { extensionForMimeType, validateUpload } from "./mediaConfig";
import { proxiedUrl, resolveSubject } from "./util";

import type { AttachmentMetadata } from "lib/db/schema/attachment.table";

/** One year, in seconds, for immutable content-hashed object caching */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Generated thumbnail width in pixels */
const THUMBNAIL_WIDTH = 480;

/** Blur-up placeholder width in pixels */
const LQIP_WIDTH = 16;

const attachmentUploadRoutes = new Elysia({ prefix: "/api/attachments" }).post(
  "/upload",
  async ({ request, body, set }) => {
    const { sub, token } = await resolveSubject(
      request.headers.get("authorization"),
    );

    if (!sub && protectRoutes) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { file, taskId, postId } = body;
    if (!file) {
      set.status = 400;
      return { error: "No file provided" };
    }

    const validation = validateUpload(file.type, file.size);
    if ("error" in validation) {
      set.status = file.size > 0 ? 415 : 400;
      return { error: validation.error };
    }
    const { kind } = validation;

    // Resolve the task and its owning org/project for authorization + scoping
    const [task] = await dbPool
      .select({
        projectId: tasks.projectId,
        organizationId: projects.organizationId,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) {
      set.status = 404;
      return { error: "Task not found" };
    }

    // Editor permission on the project is required to attach (mirrors createTask)
    if (sub) {
      const allowed = await checkPermission(
        sub,
        "project",
        task.projectId,
        "editor",
        token ?? "",
      );
      if (!allowed) {
        set.status = 403;
        return { error: "Forbidden" };
      }
    }

    // Per-file size gate
    const withinFileLimit = await isWithinLimit(
      { organizationId: task.organizationId },
      FEATURE_KEYS.MAX_ATTACHMENT_BYTES,
      file.size,
      billingBypassOrgIds,
    );
    if (!withinFileLimit) {
      set.status = 413;
      return { error: "File exceeds the per-file size limit for this plan" };
    }

    // Per-org total storage gate
    const [{ total: usedBytes } = { total: 0 }] = await dbPool
      .select({
        total: sql<number>`coalesce(sum(${attachments.fileSize}), 0)::int`,
      })
      .from(attachments)
      .where(eq(attachments.organizationId, task.organizationId));

    const withinStorageLimit = await isWithinLimit(
      { organizationId: task.organizationId },
      FEATURE_KEYS.MAX_STORAGE_BYTES,
      usedBytes + file.size,
      billingBypassOrgIds,
    );
    if (!withinStorageLimit) {
      set.status = 413;
      return { error: "Organization has reached its storage limit" };
    }

    // Resolve the local uploader record (nullable: file survives user deletion)
    const author = sub
      ? await dbPool.query.users.findFirst({
          where: eq(users.identityProviderId, sub),
          columns: { id: true },
        })
      : undefined;

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
    const extension = extensionForMimeType(file.type);
    const storageKey = `runa/${task.organizationId}/${taskId}/${hash}.${extension}`;

    // Derive dimensions, thumbnail, and blur-up placeholder for images
    let width: number | null = null;
    let height: number | null = null;
    const metadata: AttachmentMetadata = {};

    if (kind === "image") {
      try {
        const meta = await sharp(buffer).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;

        const thumb = await sharp(buffer)
          .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer({ resolveWithObject: true });
        const thumbKey = `runa/${task.organizationId}/${taskId}/thumb/${hash}.webp`;
        await storage.upload({
          key: thumbKey,
          body: thumb.data,
          contentType: "image/webp",
          cacheControl: `public, max-age=${ONE_YEAR_SECONDS}, immutable`,
        });
        metadata.thumbnailUrl = proxiedUrl(thumbKey);
        metadata.thumbnailWidth = thumb.info.width;
        metadata.thumbnailHeight = thumb.info.height;

        const lqipBuffer = await sharp(buffer)
          .resize(LQIP_WIDTH)
          .webp({ quality: 30 })
          .toBuffer();
        metadata.lqip = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;
      } catch (error) {
        // Non-fatal: store the original without a thumbnail
        console.warn("[Attachments] Image processing failed:", error);
      }
    }

    try {
      await storage.upload({
        key: storageKey,
        body: buffer,
        contentType: file.type,
        cacheControl: `public, max-age=${ONE_YEAR_SECONDS}, immutable`,
      });
    } catch (error) {
      console.error("[Attachments] Upload failed:", error);
      set.status = 502;
      return { error: "Failed to store attachment" };
    }

    const [record] = await dbPool
      .insert(attachments)
      .values({
        taskId,
        postId: postId ?? null,
        authorId: author?.id ?? null,
        organizationId: task.organizationId,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        kind,
        storageKey,
        url: proxiedUrl(storageKey),
        width,
        height,
        metadata,
      })
      .returning();

    void events
      .emit({
        type: "runa.attachment.created",
        data: {
          id: record.id,
          taskId,
          organizationId: task.organizationId,
          kind,
          fileSize: file.size,
          actorId: author?.id,
        },
        subject: record.id,
      })
      .catch((error: unknown) => {
        console.warn("[Attachments] Event emit failed:", error);
      });

    set.status = 201;
    return record;
  },
  {
    body: t.Object({
      file: t.File(),
      taskId: t.String(),
      postId: t.Optional(t.String()),
    }),
  },
);

export default attachmentUploadRoutes;
