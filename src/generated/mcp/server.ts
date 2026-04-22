import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { GraphQLClient } from "graphql-request";

function set(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current)) current[keys[i]] = {};
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

const projectsDocument = `
  query projects {
    projects {
      nodes {
        rowId
        name
        slug
        description
        color
        columns {
          nodes {
            rowId
            title
            index
            icon
          }
        }
      }
    }
  }
`;

const tasksDocument = `
  query tasks($condition: TaskCondition, $filter: TaskFilter, $first: Int) {
    tasks(condition: $condition, filter: $filter, first: $first) {
      nodes {
        rowId
        number
        content
        description
        priority
        dueDate
        columnId
        projectId
        column {
          title
        }
        project {
          name
          slug
        }
        author {
          name
          email
        }
        assignees {
          nodes {
            user {
              name
              email
            }
          }
        }
        taskLabels {
          nodes {
            label {
              name
              color
            }
          }
        }
      }
    }
  }
`;

const createTaskDocument = `
  mutation createTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      task {
        rowId
        number
        content
        description
        priority
        columnId
        projectId
        createdAt
      }
    }
  }
`;

const updateTaskDocument = `
  mutation updateTask($input: UpdateTaskInput!) {
    updateTask(input: $input) {
      task {
        rowId
        number
        content
        description
        priority
        columnId
        projectId
        updatedAt
        column {
          title
        }
      }
    }
  }
`;

const getTaskDocument = `
  query getTask($rowId: UUID!) {
    task(rowId: $rowId) {
      rowId
      number
      content
      description
      priority
      dueDate
      createdAt
      updatedAt
      columnId
      projectId
      column {
        title
      }
      project {
        name
        slug
      }
      author {
        name
        email
      }
      assignees {
        nodes {
          user {
            name
            email
          }
        }
      }
      posts(orderBy: $orderBy) {
        nodes {
          rowId
          title
          description
          createdAt
          author {
            name
            email
          }
        }
      }
      taskLabels {
        nodes {
          label {
            name
            color
          }
        }
      }
    }
  }
`;

const columnsDocument = `
  query columns($condition: ColumnCondition) {
    columns(condition: $condition, orderBy: $orderBy) {
      nodes {
        rowId
        title
        index
        icon
        projectId
      }
    }
  }
`;

const createPostDocument = `
  mutation createPost($input: CreatePostInput!) {
    createPost(input: $input) {
      post {
        rowId
        title
        description
        taskId
        createdAt
      }
    }
  }
`;

const graphql = new GraphQLClient(
  process.env.GRAPHQL_ENDPOINT ?? "http://localhost:4000/graphql"
);

function registerTools(server: McpServer) {
  server.tool(
    "list_projects",
    "List all task boards in the organization with their columns.",
    {},
    async () => {
      const data = await graphql.request(projectsDocument);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "list_tasks",
    "List and filter tasks. Use simple field filters or date range queries.",
    { projectId: z.string().uuid().optional().describe("Filter by project UUID"), priority: z.enum(["low", "medium", "high", "urgent"]).optional().describe("Filter by priority level"), columnId: z.string().uuid().optional().describe("Filter by column UUID"), authorId: z.string().uuid().optional().describe("Filter by task author UUID"), dueBefore: z.string().datetime().optional().describe("Only return tasks due before this ISO datetime"), dueAfter: z.string().datetime().optional().describe("Only return tasks due after this ISO datetime"), limit: z.number().default(20).optional().describe("Maximum number of tasks to return (1-100)")},
    async (params) => {
      const variables: Record<string, unknown> = {};
      if (params.projectId !== undefined) set(variables, "condition.projectId", params.projectId);
      if (params.priority !== undefined) set(variables, "condition.priority", params.priority);
      if (params.columnId !== undefined) set(variables, "condition.columnId", params.columnId);
      if (params.authorId !== undefined) set(variables, "condition.authorId", params.authorId);
      if (params.dueBefore !== undefined) set(variables, "filter.dueDate.lessThan", params.dueBefore);
      if (params.dueAfter !== undefined) set(variables, "filter.dueDate.greaterThan", params.dueAfter);
      if (params.limit !== undefined) set(variables, "first", params.limit);
      const data = await graphql.request(tasksDocument, variables);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_task",
    "Create a new task on a project board.",
    { content: z.string().describe("Task title"), description: z.string().describe("Task description (supports markdown)"), projectId: z.string().uuid().describe("Project UUID to create the task in"), columnId: z.string().uuid().describe("Column UUID to place the task in"), priority: z.enum(["low", "medium", "high", "urgent"]).optional().describe("Task priority level"), dueDate: z.string().datetime().optional().describe("Due date as ISO datetime")},
    async (params) => {
      const variables: Record<string, unknown> = {};
      if (params.content !== undefined) set(variables, "input.task.content", params.content);
      if (params.description !== undefined) set(variables, "input.task.description", params.description);
      if (params.projectId !== undefined) set(variables, "input.task.projectId", params.projectId);
      if (params.columnId !== undefined) set(variables, "input.task.columnId", params.columnId);
      if (params.priority !== undefined) set(variables, "input.task.priority", params.priority);
      if (params.dueDate !== undefined) set(variables, "input.task.dueDate", params.dueDate);
      const data = await graphql.request(createTaskDocument, variables);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "move_task",
    "Update a task — move it to a different column, change priority, or edit content.",
    { rowId: z.string().uuid().describe("UUID of the task to update"), columnId: z.string().uuid().optional().describe("Move task to this column"), priority: z.enum(["low", "medium", "high", "urgent"]).optional().describe("New priority level"), content: z.string().optional().describe("New task title"), description: z.string().optional().describe("New task description"), dueDate: z.string().datetime().optional().describe("New due date as ISO datetime")},
    async (params) => {
      const variables: Record<string, unknown> = {};
      if (params.rowId !== undefined) set(variables, "input.rowId", params.rowId);
      if (params.columnId !== undefined) set(variables, "input.patch.columnId", params.columnId);
      if (params.priority !== undefined) set(variables, "input.patch.priority", params.priority);
      if (params.content !== undefined) set(variables, "input.patch.content", params.content);
      if (params.description !== undefined) set(variables, "input.patch.description", params.description);
      if (params.dueDate !== undefined) set(variables, "input.patch.dueDate", params.dueDate);
      const data = await graphql.request(updateTaskDocument, variables);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_task",
    "Get full task detail including comments, labels, and assignees.",
    { rowId: z.object({  })},
    async ({ rowId }) => {
      const data = await graphql.request(getTaskDocument, { rowId });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "list_columns",
    "List kanban columns for a project, ordered by index.",
    { projectId: z.string().uuid().describe("Project UUID to list columns for")},
    async (params) => {
      const variables: Record<string, unknown> = {};
      if (params.projectId !== undefined) set(variables, "condition.projectId", params.projectId);
      const data = await graphql.request(columnsDocument, variables);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "add_comment",
    "Add a comment to a task.",
    { taskId: z.string().uuid().describe("Task UUID to comment on"), description: z.string().describe("Comment body (supports markdown)"), title: z.string().optional().describe("Optional comment title")},
    async (params) => {
      const variables: Record<string, unknown> = {};
      if (params.taskId !== undefined) set(variables, "input.post.taskId", params.taskId);
      if (params.description !== undefined) set(variables, "input.post.description", params.description);
      if (params.title !== undefined) set(variables, "input.post.title", params.title);
      const data = await graphql.request(createPostDocument, variables);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

}

const app = Bun.serve({
  port: Number(process.env.MCP_PORT ?? 4001),
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/mcp") {
      const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      const server = new McpServer({ name: "runa-mcp", description: "Runa project management. Create tasks, manage boards, and track work.", version: "1.0.0" });
      registerTools(server);
      await server.connect(transport);
      const response = await transport.handleRequest(req);
      await transport.close();
      await server.close();
      return response;
    }
    return new Response("Not Found", { status: 404 });
  },
});

console.error(`runa-mcp listening on port ${app.port}`);