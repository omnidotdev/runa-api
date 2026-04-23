export default {
  schema: "src/generated/graphql/schema.graphql",
  generate: {
    targets: ["mcp"],
    output: "src/generated/mcp",
    operations: "src/operations/**/*.graphql",
    mcp: {
      name: "runa-mcp",
      description:
        "Runa project management. Create tasks, manage boards, and track work.",
      tools: [
        {
          operation: "projects",
          name: "list_projects",
          description:
            "List all task boards in the organization with their columns.",
        },
        {
          operation: "tasks",
          name: "list_tasks",
          description:
            "List and filter tasks. Use simple field filters or date range queries.",
          parameters: [
            {
              name: "projectId",
              type: "string",
              format: "uuid",
              description: "Filter by project UUID",
              mapTo: "condition.projectId",
            },
            {
              name: "priority",
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Filter by priority level",
              mapTo: "condition.priority",
            },
            {
              name: "columnId",
              type: "string",
              format: "uuid",
              description: "Filter by column UUID",
              mapTo: "condition.columnId",
            },
            {
              name: "authorId",
              type: "string",
              format: "uuid",
              description: "Filter by task author UUID",
              mapTo: "condition.authorId",
            },
            {
              name: "dueBefore",
              type: "string",
              format: "datetime",
              description: "Only return tasks due before this ISO datetime",
              mapTo: "filter.dueDate.lessThan",
            },
            {
              name: "dueAfter",
              type: "string",
              format: "datetime",
              description: "Only return tasks due after this ISO datetime",
              mapTo: "filter.dueDate.greaterThan",
            },
            {
              name: "limit",
              type: "number",
              default: 20,
              description: "Maximum number of tasks to return (1-100)",
              mapTo: "first",
            },
          ],
        },
        {
          operation: "createTask",
          name: "create_task",
          description: "Create a new task on a project board.",
          parameters: [
            {
              name: "content",
              type: "string",
              required: true,
              description: "Task title",
              mapTo: "input.task.content",
            },
            {
              name: "description",
              type: "string",
              required: true,
              description: "Task description (supports markdown)",
              mapTo: "input.task.description",
            },
            {
              name: "projectId",
              type: "string",
              format: "uuid",
              required: true,
              description: "Project UUID to create the task in",
              mapTo: "input.task.projectId",
            },
            {
              name: "columnId",
              type: "string",
              format: "uuid",
              required: true,
              description: "Column UUID to place the task in",
              mapTo: "input.task.columnId",
            },
            {
              name: "priority",
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "Task priority level",
              mapTo: "input.task.priority",
            },
            {
              name: "dueDate",
              type: "string",
              format: "datetime",
              description: "Due date as ISO datetime",
              mapTo: "input.task.dueDate",
            },
          ],
        },
        {
          operation: "updateTask",
          name: "move_task",
          description:
            "Update a task — move it to a different column, change priority, or edit content.",
          parameters: [
            {
              name: "rowId",
              type: "string",
              format: "uuid",
              required: true,
              description: "UUID of the task to update",
              mapTo: "input.rowId",
            },
            {
              name: "columnId",
              type: "string",
              format: "uuid",
              description: "Move task to this column",
              mapTo: "input.patch.columnId",
            },
            {
              name: "priority",
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
              description: "New priority level",
              mapTo: "input.patch.priority",
            },
            {
              name: "content",
              type: "string",
              description: "New task title",
              mapTo: "input.patch.content",
            },
            {
              name: "description",
              type: "string",
              description: "New task description",
              mapTo: "input.patch.description",
            },
            {
              name: "dueDate",
              type: "string",
              format: "datetime",
              description: "New due date as ISO datetime",
              mapTo: "input.patch.dueDate",
            },
          ],
        },
        {
          operation: "getTask",
          name: "get_task",
          description:
            "Get full task detail including comments, labels, and assignees.",
          parameters: [
            {
              name: "rowId",
              type: "string",
              format: "uuid",
              required: true,
              description: "Task UUID to retrieve",
              mapTo: "rowId",
            },
          ],
        },
        {
          operation: "columns",
          name: "list_columns",
          description: "List kanban columns for a project, ordered by index.",
          parameters: [
            {
              name: "projectId",
              type: "string",
              format: "uuid",
              required: true,
              description: "Project UUID to list columns for",
              mapTo: "condition.projectId",
            },
          ],
        },
        {
          operation: "createPost",
          name: "add_comment",
          description: "Add a comment to a task.",
          parameters: [
            {
              name: "taskId",
              type: "string",
              format: "uuid",
              required: true,
              description: "Task UUID to comment on",
              mapTo: "input.post.taskId",
            },
            {
              name: "description",
              type: "string",
              required: true,
              description: "Comment body (supports markdown)",
              mapTo: "input.post.description",
            },
            {
              name: "title",
              type: "string",
              description: "Optional comment title",
              mapTo: "input.post.title",
            },
          ],
        },
      ],
    },
  },
};
