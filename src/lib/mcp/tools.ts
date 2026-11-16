/**
 * Runa's MCP tools. Every tool runs a GraphQL operation as the calling API
 * token, so the token's scopes, workspace, and permissions apply exactly as
 * they do for any other API client; nothing here bypasses authorization
 */

import { generateKeyBetween } from "fractional-indexing";
import { z } from "zod";

import { htmlToText, plainTextToHtml } from "lib/mcp/content";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Runs a GraphQL operation as the caller; throws on GraphQL errors */
export type GraphqlRunner = <T>(
  query: string,
  variables?: Record<string, unknown>,
) => Promise<T>;

interface ToolContext {
  graphql: GraphqlRunner;
  /** Local id of the user the token acts as (author of created content) */
  userId: string;
}

const PRIORITIES = ["low", "medium", "high"] as const;

/** Wrap a JSON-able result as MCP text content */
const json = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

/** Report a failure to the client without leaking internals */
const failure = (error: unknown) => ({
  isError: true,
  content: [
    {
      type: "text" as const,
      text: error instanceof Error ? error.message : "The request failed",
    },
  ],
});

const run =
  <A>(handler: (args: A) => Promise<unknown>) =>
  async (args: A) => {
    try {
      return json(await handler(args));
    } catch (error) {
      return failure(error);
    }
  };

interface TaskNode {
  rowId: string;
  number: number | null;
  content: string;
  description: string;
  priority: string | null;
  dueDate: string | null;
  columnId: string;
  column: { title: string } | null;
  project: { name: string; prefix: string | null } | null;
  assignees: { nodes: { user: { name: string } | null }[] };
}

const TASK_FIELDS = `
  rowId number content description priority dueDate columnId
  column { title }
  project { name prefix }
  assignees { nodes { user { name } } }
`;

/** A compact, readable task shape for clients */
const summarizeTask = (task: TaskNode, includeDescription = false) => ({
  id: task.rowId,
  key:
    task.number != null
      ? `${task.project?.prefix ? `${task.project.prefix}-` : ""}${task.number}`
      : null,
  title: htmlToText(task.content),
  ...(includeDescription ? { description: htmlToText(task.description) } : {}),
  status: task.column?.title ?? null,
  columnId: task.columnId,
  priority: task.priority,
  dueDate: task.dueDate,
  assignees: task.assignees.nodes.flatMap((a) => (a.user ? [a.user.name] : [])),
});

/** Fractional index that places a task at the end of a column */
const endOfColumnIndex = async (
  graphql: GraphqlRunner,
  columnId: string,
): Promise<string> => {
  const data = await graphql<{
    tasks: { nodes: { columnIndex: string }[] };
  }>(
    `query ($columnId: UUID!) {
      tasks(condition: { columnId: $columnId }, orderBy: COLUMN_INDEX_DESC, first: 1) {
        nodes { columnIndex }
      }
    }`,
    { columnId },
  );
  return generateKeyBetween(data.tasks.nodes[0]?.columnIndex ?? null, null);
};

/** Register every Runa tool on a server bound to one caller */
export const registerRunaTools = (
  server: McpServer,
  { graphql, userId }: ToolContext,
) => {
  server.registerTool(
    "list_projects",
    {
      description:
        "List the projects (task boards) in the workspace this API token belongs to.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    run(async () => {
      const data = await graphql<{
        projects: {
          nodes: {
            rowId: string;
            name: string;
            slug: string;
            prefix: string | null;
          }[];
        };
      }>(
        `{ projects(orderBy: NAME_ASC) { nodes { rowId name slug prefix } } }`,
      );
      return data.projects.nodes.map((p) => ({
        id: p.rowId,
        name: p.name,
        slug: p.slug,
        prefix: p.prefix,
      }));
    }),
  );

  server.registerTool(
    "list_columns",
    {
      description:
        "List a project's columns (task statuses) in board order. A column marked done is where finished work goes.",
      inputSchema: { projectId: z.string().uuid() },
      annotations: { readOnlyHint: true },
    },
    run(async ({ projectId }: { projectId: string }) => {
      const data = await graphql<{
        columns: {
          nodes: { rowId: string; title: string; isDone: boolean }[];
        };
      }>(
        `query ($projectId: UUID!) {
          columns(condition: { projectId: $projectId }, orderBy: INDEX_ASC) {
            nodes { rowId title isDone }
          }
        }`,
        { projectId },
      );
      return data.columns.nodes.map((c) => ({
        id: c.rowId,
        title: c.title,
        done: c.isDone,
      }));
    }),
  );

  server.registerTool(
    "list_tasks",
    {
      description:
        "List tasks in a project, optionally narrowed to one column, a priority, or a title search.",
      inputSchema: {
        projectId: z.string().uuid(),
        columnId: z.string().uuid().optional(),
        priority: z.enum(PRIORITIES).optional(),
        search: z.string().max(200).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    run(
      async (args: {
        projectId: string;
        columnId?: string;
        priority?: (typeof PRIORITIES)[number];
        search?: string;
        limit?: number;
      }) => {
        const filter: Record<string, unknown> = {
          projectId: { equalTo: args.projectId },
        };
        if (args.columnId) filter.columnId = { equalTo: args.columnId };
        if (args.priority) filter.priority = { equalTo: args.priority };
        if (args.search) filter.content = { includesInsensitive: args.search };

        const data = await graphql<{ tasks: { nodes: TaskNode[] } }>(
          `query ($filter: TaskFilter!, $first: Int!) {
            tasks(filter: $filter, orderBy: COLUMN_INDEX_ASC, first: $first) {
              nodes { ${TASK_FIELDS} }
            }
          }`,
          { filter, first: args.limit ?? 50 },
        );
        return data.tasks.nodes.map((task) => summarizeTask(task));
      },
    ),
  );

  server.registerTool(
    "get_task",
    {
      description: "Get a task's details, description, and comments.",
      inputSchema: { taskId: z.string().uuid() },
      annotations: { readOnlyHint: true },
    },
    run(async ({ taskId }: { taskId: string }) => {
      const data = await graphql<{
        task:
          | (TaskNode & {
              posts: {
                nodes: {
                  description: string | null;
                  createdAt: string;
                  author: { name: string } | null;
                }[];
              };
            })
          | null;
      }>(
        `query ($taskId: UUID!) {
          task(rowId: $taskId) {
            ${TASK_FIELDS}
            posts(orderBy: CREATED_AT_ASC) {
              nodes { description createdAt author { name } }
            }
          }
        }`,
        { taskId },
      );
      if (!data.task) throw new Error("Task not found");
      return {
        ...summarizeTask(data.task, true),
        comments: data.task.posts.nodes.map((post) => ({
          author: post.author?.name ?? null,
          at: post.createdAt,
          text: htmlToText(post.description),
        })),
      };
    }),
  );

  server.registerTool(
    "create_task",
    {
      description:
        "Create a task in a project. It goes at the end of the given column, or the project's first column when none is given.",
      inputSchema: {
        projectId: z.string().uuid(),
        title: z.string().min(1).max(500),
        description: z.string().max(20_000).optional(),
        columnId: z.string().uuid().optional(),
        priority: z.enum(PRIORITIES).optional(),
        dueDate: z.string().datetime({ offset: true }).optional(),
      },
    },
    run(
      async (args: {
        projectId: string;
        title: string;
        description?: string;
        columnId?: string;
        priority?: (typeof PRIORITIES)[number];
        dueDate?: string;
      }) => {
        let columnId = args.columnId;
        if (!columnId) {
          const columns = await graphql<{
            columns: { nodes: { rowId: string }[] };
          }>(
            `query ($projectId: UUID!) {
              columns(condition: { projectId: $projectId }, orderBy: INDEX_ASC, first: 1) {
                nodes { rowId }
              }
            }`,
            { projectId: args.projectId },
          );
          columnId = columns.columns.nodes[0]?.rowId;
          if (!columnId) throw new Error("The project has no columns");
        }

        const data = await graphql<{
          createTask: { task: TaskNode } | null;
        }>(
          `mutation ($task: TaskInput!) {
            createTask(input: { task: $task }) { task { ${TASK_FIELDS} } }
          }`,
          {
            task: {
              projectId: args.projectId,
              columnId,
              columnIndex: await endOfColumnIndex(graphql, columnId),
              content: plainTextToHtml(args.title),
              description: args.description
                ? plainTextToHtml(args.description)
                : "",
              priority: args.priority ?? "medium",
              dueDate: args.dueDate ?? null,
              authorId: userId,
            },
          },
        );
        if (!data.createTask?.task) throw new Error("The task was not created");
        return summarizeTask(data.createTask.task);
      },
    ),
  );

  server.registerTool(
    "update_task",
    {
      description:
        "Update a task's title, description, priority, or due date. Pass dueDate as null to clear it.",
      inputSchema: {
        taskId: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(20_000).optional(),
        priority: z.enum(PRIORITIES).optional(),
        dueDate: z.string().datetime({ offset: true }).nullable().optional(),
      },
      annotations: { idempotentHint: true },
    },
    run(
      async (args: {
        taskId: string;
        title?: string;
        description?: string;
        priority?: (typeof PRIORITIES)[number];
        dueDate?: string | null;
      }) => {
        const patch: Record<string, unknown> = {};
        if (args.title !== undefined)
          patch.content = plainTextToHtml(args.title);
        if (args.description !== undefined)
          patch.description = plainTextToHtml(args.description);
        if (args.priority !== undefined) patch.priority = args.priority;
        if (args.dueDate !== undefined) patch.dueDate = args.dueDate;
        if (!Object.keys(patch).length) throw new Error("Nothing to update");

        const data = await graphql<{ updateTask: { task: TaskNode } | null }>(
          `mutation ($rowId: UUID!, $patch: TaskPatch!) {
            updateTask(input: { rowId: $rowId, patch: $patch }) { task { ${TASK_FIELDS} } }
          }`,
          { rowId: args.taskId, patch },
        );
        if (!data.updateTask?.task) throw new Error("Task not found");
        return summarizeTask(data.updateTask.task);
      },
    ),
  );

  server.registerTool(
    "move_task",
    {
      description:
        "Move a task to another column of the same project (for example to change its status). It goes to the end of that column.",
      inputSchema: {
        taskId: z.string().uuid(),
        columnId: z.string().uuid(),
      },
    },
    run(async ({ taskId, columnId }: { taskId: string; columnId: string }) => {
      const data = await graphql<{ updateTask: { task: TaskNode } | null }>(
        `mutation ($rowId: UUID!, $patch: TaskPatch!) {
          updateTask(input: { rowId: $rowId, patch: $patch }) { task { ${TASK_FIELDS} } }
        }`,
        {
          rowId: taskId,
          patch: {
            columnId,
            columnIndex: await endOfColumnIndex(graphql, columnId),
          },
        },
      );
      if (!data.updateTask?.task) throw new Error("Task not found");
      return summarizeTask(data.updateTask.task);
    }),
  );

  server.registerTool(
    "add_comment",
    {
      description: "Add a comment to a task.",
      inputSchema: {
        taskId: z.string().uuid(),
        body: z.string().min(1).max(20_000),
      },
    },
    run(async ({ taskId, body }: { taskId: string; body: string }) => {
      const data = await graphql<{
        createPost: { post: { rowId: string; createdAt: string } } | null;
      }>(
        `mutation ($post: PostInput!) {
          createPost(input: { post: $post }) { post { rowId createdAt } }
        }`,
        {
          post: {
            taskId,
            authorId: userId,
            description: plainTextToHtml(body),
          },
        },
      );
      if (!data.createPost?.post) throw new Error("The comment was not added");
      return {
        id: data.createPost.post.rowId,
        at: data.createPost.post.createdAt,
      };
    }),
  );
};
