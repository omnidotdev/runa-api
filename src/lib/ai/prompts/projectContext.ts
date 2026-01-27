import { eq } from "drizzle-orm";

import { dbPool } from "lib/db/db";
import { columns, labels, projects, userOrganizations } from "lib/db/schema";

/**
 * Project context provided to the agent's system prompt.
 */
export interface ProjectContext {
  projectId: string;
  projectName: string;
  projectPrefix: string | null;
  organizationId: string;
  userId: string;
  userName: string;
  customInstructions: string | null;
  columns: Array<{
    id: string;
    title: string;
    icon: string | null;
    index: number;
  }>;
  labels: Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
  }>;
  members: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

/**
 * Build project context for the agent's system prompt.
 *
 * Fetches current project state including columns, labels, and org members
 * to provide the agent with up-to-date board context.
 */
export async function buildProjectContext(params: {
  projectId: string;
  organizationId: string;
  userId: string;
  userName: string;
  customInstructions: string | null;
}): Promise<ProjectContext> {
  const [project, projectColumns, projectLabels, orgMembers] =
    await Promise.all([
      dbPool.query.projects.findFirst({
        where: eq(projects.id, params.projectId),
        columns: {
          id: true,
          name: true,
          prefix: true,
        },
      }),
      dbPool
        .select({
          id: columns.id,
          title: columns.title,
          icon: columns.icon,
          index: columns.index,
        })
        .from(columns)
        .where(eq(columns.projectId, params.projectId))
        .orderBy(columns.index),
      dbPool
        .select({
          id: labels.id,
          name: labels.name,
          color: labels.color,
          icon: labels.icon,
        })
        .from(labels)
        .where(eq(labels.projectId, params.projectId)),
      dbPool
        .select({
          userId: userOrganizations.userId,
        })
        .from(userOrganizations)
        .where(eq(userOrganizations.organizationId, params.organizationId))
        .then(async (orgMemberships) => {
          if (orgMemberships.length === 0) return [];

          const memberIds = orgMemberships.map((m) => m.userId);
          const memberUsers = await dbPool.query.users.findMany({
            where: (table, { inArray }) => inArray(table.id, memberIds),
            columns: {
              id: true,
              name: true,
              email: true,
            },
          });

          return memberUsers;
        }),
    ]);

  if (!project) {
    throw new Error(`Project ${params.projectId} not found`);
  }

  // Also fetch org-scoped labels
  const orgLabels = await dbPool
    .select({
      id: labels.id,
      name: labels.name,
      color: labels.color,
      icon: labels.icon,
    })
    .from(labels)
    .where(eq(labels.organizationId, params.organizationId));

  const allLabels = [...projectLabels, ...orgLabels];

  return {
    projectId: project.id,
    projectName: project.name,
    projectPrefix: project.prefix,
    organizationId: params.organizationId,
    userId: params.userId,
    userName: params.userName,
    customInstructions: params.customInstructions,
    columns: projectColumns,
    labels: allLabels,
    members: orgMembers,
  };
}
