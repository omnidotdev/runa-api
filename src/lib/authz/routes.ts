import { Elysia } from "elysia";

import { dbPool } from "lib/db/db";
import { projects, workspaces } from "lib/db/schema";

interface TupleKey {
  user: string;
  relation: string;
  object: string;
}

/**
 * Export all authorization tuples from Runa's source of truth.
 * Used by warden-api to rebuild OpenFGA tuples.
 *
 * Note: Member tuples (user→organization relationships) are NOT exported here.
 * Those are managed by IDP (Gatekeeper), which is the source of truth for
 * organization membership. This endpoint only exports Runa-specific resource
 * relationships (workspace→organization, project→workspace).
 */
async function exportAllTuples(): Promise<TupleKey[]> {
  const tuples: TupleKey[] = [];

  // 1. Project-workspace relationships (project table)
  // workspace:X has 'workspace' relation on project:Y
  const allProjects = await dbPool.select().from(projects);
  for (const p of allProjects) {
    tuples.push({
      user: `workspace:${p.workspaceId}`,
      relation: "workspace",
      object: `project:${p.id}`,
    });
  }

  // 2. Workspace-organization relationships (workspace table)
  // organization:X has 'organization' relation on workspace:Y
  const allWorkspaces = await dbPool.select().from(workspaces);
  for (const w of allWorkspaces) {
    if (w.organizationId) {
      tuples.push({
        user: `organization:${w.organizationId}`,
        relation: "organization",
        object: `workspace:${w.id}`,
      });
    }
  }

  return tuples;
}

/**
 * Authorization routes for tuple export.
 * Called by warden-api during tuple rebuilds.
 */
const authzRoutes = new Elysia({ prefix: "/authz" }).get(
  "/tuples",
  async () => {
    const tuples = await exportAllTuples();

    return {
      tuples,
      count: tuples.length,
      exportedAt: new Date().toISOString(),
    };
  },
);

export default authzRoutes;
