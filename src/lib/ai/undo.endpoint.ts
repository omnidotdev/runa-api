/**
 * AI Agent undo endpoint.
 *
 * POST /api/ai/undo - Undo an agent activity
 * GET  /api/ai/undo/:activityId - Check if an activity can be undone
 */

import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { agentActivities } from "lib/db/schema";
import { agentFeatureGuard, authGuard } from "./guards";
import { UNDO_WINDOW_MS, canUndoActivity, executeUndo } from "./undo";

/**
 * AI Agent undo routes.
 *
 * POST /api/ai/undo    - Execute undo for an activity
 * GET  /api/ai/undo/:activityId - Check if activity can be undone
 */
const undoRoutes = new Elysia({ prefix: "/api/ai/undo" })
  .use(agentFeatureGuard)
  .use(authGuard)
  .post(
    "/",
    async ({ body, auth, set }) => {
      const { activityId } = body;

      // Fetch the activity
      const activity = await dbPool.query.agentActivities.findFirst({
        where: eq(agentActivities.id, activityId),
      });

      if (!activity) {
        set.status = 404;
        return { error: "Activity not found" };
      }

      // Validate user has access to this activity's project
      const hasAccess = auth.organizations.some(
        (org) => org.id === activity.organizationId,
      );
      if (!hasAccess) {
        set.status = 403;
        return { error: "Access denied" };
      }

      // Execute the undo
      const result = await executeUndo(activity, {
        userId: auth.user.id,
        organizationId: activity.organizationId,
        projectId: activity.projectId,
      });

      if (!result.success) {
        set.status = 400;
        return { error: result.message };
      }

      return {
        success: true,
        message: result.message,
        restoredEntityId: result.restoredEntityId,
        restoredEntityIds: result.restoredEntityIds,
      };
    },
    {
      body: t.Object({
        activityId: t.String(),
      }),
    },
  )
  .get(
    "/:activityId",
    async ({ params, auth, set }) => {
      const { activityId } = params;

      // Fetch the activity
      const activity = await dbPool.query.agentActivities.findFirst({
        where: eq(agentActivities.id, activityId),
      });

      if (!activity) {
        set.status = 404;
        return { canUndo: false, reason: "Activity not found" };
      }

      // Validate user has access
      const hasAccess = auth.organizations.some(
        (org) => org.id === activity.organizationId,
      );
      if (!hasAccess) {
        set.status = 403;
        return { canUndo: false, reason: "Access denied" };
      }

      const { canUndo, reason } = canUndoActivity(activity);

      // Calculate remaining undo time if within window
      let remainingSeconds: number | undefined;
      if (canUndo) {
        const createdAt = new Date(activity.createdAt).getTime();
        const expiresAt = createdAt + UNDO_WINDOW_MS;
        remainingSeconds = Math.max(
          0,
          Math.ceil((expiresAt - Date.now()) / 1000),
        );
      }

      return {
        canUndo,
        reason: reason ?? undefined,
        remainingSeconds,
      };
    },
    {
      params: t.Object({
        activityId: t.String(),
      }),
    },
  );

export default undoRoutes;
