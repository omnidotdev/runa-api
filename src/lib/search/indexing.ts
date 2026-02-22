import { runaIndexes, search } from "./client";

import type { SelectPost } from "lib/db/schema/post.table";
import type { SelectProject } from "lib/db/schema/project.table";
import type { SelectTask } from "lib/db/schema/task.table";

/**
 * Document structure for project search index.
 */
interface ProjectDocument {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Document structure for task search index.
 */
interface TaskDocument {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
  description: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

/**
 * Document structure for comment (post) search index.
 */
interface CommentDocument {
  id: string;
  organization_id: string;
  task_id: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Index a project document.
 */
export async function indexProject(project: SelectProject): Promise<void> {
  if (!search) return;

  const document: ProjectDocument = {
    id: project.id,
    organization_id: project.organizationId,
    name: project.name,
    description: project.description,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };

  try {
    await search.addDocuments(runaIndexes.projects.name, [document]);
  } catch (error) {
    console.error(`[Search] Failed to index project ${project.id}:`, error);
  }
}

/**
 * Remove a project from the search index.
 */
export async function deleteProjectFromIndex(
  projectId: string,
): Promise<void> {
  if (!search) return;

  try {
    await search.deleteDocuments(runaIndexes.projects.name, [projectId]);
  } catch (error) {
    console.error(`[Search] Failed to delete project ${projectId}:`, error);
  }
}

/**
 * Index a task document.
 * Maps task `content` field to search `title` attribute.
 */
export async function indexTask(
  task: SelectTask,
  organizationId: string,
): Promise<void> {
  if (!search) return;

  const document: TaskDocument = {
    id: task.id,
    organization_id: organizationId,
    project_id: task.projectId,
    title: task.content,
    description: task.description,
    priority: task.priority,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };

  try {
    await search.addDocuments(runaIndexes.tasks.name, [document]);
  } catch (error) {
    console.error(`[Search] Failed to index task ${task.id}:`, error);
  }
}

/**
 * Remove a task from the search index.
 */
export async function deleteTaskFromIndex(taskId: string): Promise<void> {
  if (!search) return;

  try {
    await search.deleteDocuments(runaIndexes.tasks.name, [taskId]);
  } catch (error) {
    console.error(`[Search] Failed to delete task ${taskId}:`, error);
  }
}

/**
 * Index a post (comment) document.
 * Maps post `description` field to search `content` attribute.
 */
export async function indexComment(
  post: SelectPost,
  organizationId: string,
): Promise<void> {
  if (!search) return;

  const document: CommentDocument = {
    id: post.id,
    organization_id: organizationId,
    task_id: post.taskId,
    content: post.description,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };

  try {
    await search.addDocuments(runaIndexes.comments.name, [document]);
  } catch (error) {
    console.error(`[Search] Failed to index comment ${post.id}:`, error);
  }
}

/**
 * Remove a comment from the search index.
 */
export async function deleteCommentFromIndex(postId: string): Promise<void> {
  if (!search) return;

  try {
    await search.deleteDocuments(runaIndexes.comments.name, [postId]);
  } catch (error) {
    console.error(`[Search] Failed to delete comment ${postId}:`, error);
  }
}
