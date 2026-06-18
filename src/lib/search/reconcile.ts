import { dbPool } from "lib/db/db";
import { runaIndexes, search } from "./client";

/**
 * How often to reconcile the search index in the background (self-heal).
 */
export const SEARCH_RECONCILE_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * Reconcile (self-heal) the search indexes by re-indexing every project, task, and
 * comment from the database.
 *
 * Per-mutation indexing is best-effort: a transient Meilisearch failure is logged
 * and dropped, and rows written outside the GraphQL mutation path (e.g. a manual
 * backfill or migration) are never indexed at all. Either case leaves a document
 * missing from search indefinitely. Periodically converging the index to the
 * database restores anything that was missed. Best-effort: failures are logged,
 * never thrown.
 */
export async function reconcileSearchIndex(): Promise<void> {
  if (!search) return;

  try {
    const projects = await dbPool.query.projects.findMany({
      columns: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (projects.length > 0) {
      await search.addDocuments(
        runaIndexes.projects.name,
        projects.map((project) => ({
          id: project.id,
          organization_id: project.organizationId,
          name: project.name,
          description: project.description,
          created_at: project.createdAt,
          updated_at: project.updatedAt,
        })),
      );
    }

    const tasks = await dbPool.query.tasks.findMany({
      columns: {
        id: true,
        projectId: true,
        content: true,
        description: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
      with: { project: { columns: { organizationId: true } } },
    });
    if (tasks.length > 0) {
      await search.addDocuments(
        runaIndexes.tasks.name,
        tasks.map((task) => ({
          id: task.id,
          organization_id: task.project.organizationId,
          project_id: task.projectId,
          title: task.content,
          description: task.description,
          priority: task.priority,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
        })),
      );
    }

    const posts = await dbPool.query.posts.findMany({
      columns: {
        id: true,
        taskId: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        task: { with: { project: { columns: { organizationId: true } } } },
      },
    });
    if (posts.length > 0) {
      await search.addDocuments(
        runaIndexes.comments.name,
        posts.map((post) => ({
          id: post.id,
          organization_id: post.task.project.organizationId,
          task_id: post.taskId,
          content: post.description,
          created_at: post.createdAt,
          updated_at: post.updatedAt,
        })),
      );
    }

    console.info(
      `[Search] Reconciled index: ${projects.length} projects, ${tasks.length} tasks, ${posts.length} comments`,
    );
  } catch (error) {
    console.error("[Search] Index reconcile failed:", error);
  }
}
