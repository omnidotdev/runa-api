import { Elysia, t } from "elysia";

import { AUTHZ_API_URL, AUTHZ_SERVICE_KEY } from "lib/config/env.config";
import {
  buildExpectedTuples,
  computeDrift,
  fetchAllTuplesFromPDP,
  reconcileStructuralTuples,
} from "./reconcile";

/**
 * Authorization routes for tuple export and reconciliation.
 */
const authzRoutes = new Elysia({ prefix: "/authz" })
  .get("/tuples", async () => {
    const { orgWorkspaceTuples, workspaceProjectTuples } =
      await buildExpectedTuples();

    const tuples = [...orgWorkspaceTuples, ...workspaceProjectTuples];

    return {
      tuples,
      count: tuples.length,
      breakdown: {
        orgWorkspace: orgWorkspaceTuples.length,
        workspaceProject: workspaceProjectTuples.length,
      },
      exportedAt: new Date().toISOString(),
    };
  })
  .get(
    "/drift",
    async ({ headers, set }) => {
      const serviceKey = headers["x-service-key"];
      if (!serviceKey || serviceKey !== AUTHZ_SERVICE_KEY) {
        set.status = 401;
        return { error: "Invalid or missing service key" };
      }

      if (!AUTHZ_API_URL) {
        set.status = 400;
        return { error: "AuthZ is disabled or not configured" };
      }

      const { orgWorkspaceTuples, workspaceProjectTuples } =
        await buildExpectedTuples();
      const expectedTuples = [...orgWorkspaceTuples, ...workspaceProjectTuples];

      const actualTuples = await fetchAllTuplesFromPDP();
      const { missing, orphaned } = computeDrift(expectedTuples, actualTuples);

      return {
        expected: expectedTuples.length,
        actual: actualTuples.length,
        missing: missing.length,
        orphaned: orphaned.length,
        missingTuples: missing,
        orphanedTuples: orphaned,
        hasDrift: missing.length > 0 || orphaned.length > 0,
        checkedAt: new Date().toISOString(),
      };
    },
    {
      headers: t.Object({
        "x-service-key": t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/reconcile",
    async ({ headers, body, set }) => {
      const serviceKey = headers["x-service-key"];
      if (!serviceKey || serviceKey !== AUTHZ_SERVICE_KEY) {
        set.status = 401;
        return { error: "Invalid or missing service key" };
      }

      if (!AUTHZ_API_URL) {
        set.status = 400;
        return { error: "AuthZ is disabled or not configured" };
      }

      const result = await reconcileStructuralTuples({
        deleteOrphans: body?.deleteOrphans ?? false,
        dryRun: body?.dryRun ?? false,
      });

      return {
        success: result.errors.length === 0,
        expected: result.expected,
        actual: result.actual,
        missing: result.missing,
        orphaned: result.orphaned,
        written: result.written,
        deleted: result.deleted,
        dryRun: result.dryRun,
        errors: result.errors,
        ...(result.dryRun && {
          missingTuples: result.missingTuples,
          orphanedTuples: result.orphanedTuples,
        }),
        reconciledAt: new Date().toISOString(),
      };
    },
    {
      headers: t.Object({
        "x-service-key": t.Optional(t.String()),
      }),
      body: t.Optional(
        t.Object({
          deleteOrphans: t.Optional(t.Boolean()),
          dryRun: t.Optional(t.Boolean()),
        }),
      ),
    },
  );

export default authzRoutes;
