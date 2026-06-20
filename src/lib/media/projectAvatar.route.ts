/**
 * Project avatar upload route.
 *
 * Accepts a single multipart image plus the target `projectId`, authorizes the
 * uploader against the project, enforces per-org storage limits, writes the
 * bytes to object storage under an avatar key, and returns the serve URL. The
 * client then sets it via the `updateProject` GraphQL mutation (`patch.image`),
 * where the Project authorization plugin gates the write.
 */

import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { checkPermission } from "lib/authz";
import { protectRoutes } from "lib/config/env.config";
import { dbPool } from "lib/db/db";
import { attachments, projects } from "lib/db/schema";
import { isWithinLimit } from "lib/entitlements";
import {
  FEATURE_KEYS,
  billingBypassOrgIds,
} from "lib/graphql/plugins/authorization/constants";
import { storage } from "lib/providers";
import { extensionForMimeType, validateUpload } from "./mediaConfig";
import { proxiedUrl, resolveSubject } from "./util";

/** One year, in seconds, for immutable content-hashed object caching */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const projectAvatarRoutes = new Elysia({ prefix: "/api/projects" }).post(
  "/avatar",
  async ({ request, body, set }) => {
    const { sub, token } = await resolveSubject(
      request.headers.get("authorization"),
    );

    if (!sub && protectRoutes) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const { file, projectId } = body;
    if (!file) {
      set.status = 400;
      return { error: "No file provided" };
    }

    const validation = validateUpload(file.type, file.size);
    if ("error" in validation) {
      set.status = file.size > 0 ? 415 : 400;
      return { error: validation.error };
    }
    // Avatars must be images
    if (validation.kind !== "image") {
      set.status = 415;
      return { error: "Avatar must be an image" };
    }

    // Resolve the project's owning org for authorization + scoping
    const [project] = await dbPool
      .select({ organizationId: projects.organizationId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      set.status = 404;
      return { error: "Project not found" };
    }

    // Editor permission on the project is required to set its avatar
    if (sub) {
      const allowed = await checkPermission(
        sub,
        "project",
        projectId,
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
      { organizationId: project.organizationId },
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
      .where(eq(attachments.organizationId, project.organizationId));

    const withinStorageLimit = await isWithinLimit(
      { organizationId: project.organizationId },
      FEATURE_KEYS.MAX_STORAGE_BYTES,
      usedBytes + file.size,
      billingBypassOrgIds,
    );
    if (!withinStorageLimit) {
      set.status = 413;
      return { error: "Organization has reached its storage limit" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = extensionForMimeType(file.type);
    const storageKey = `runa/${project.organizationId}/avatars/${randomUUID()}.${extension}`;

    try {
      await storage.upload({
        key: storageKey,
        body: buffer,
        contentType: file.type,
        cacheControl: `public, max-age=${ONE_YEAR_SECONDS}, immutable`,
      });
    } catch (error) {
      console.error("[ProjectAvatar] Upload failed:", error);
      set.status = 502;
      return { error: "Failed to store avatar" };
    }

    set.status = 201;
    return { url: proxiedUrl(storageKey) };
  },
  {
    body: t.Object({
      file: t.File(),
      projectId: t.String(),
    }),
  },
);

export default projectAvatarRoutes;
