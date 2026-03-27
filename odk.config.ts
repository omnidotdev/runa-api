export default {
  schema: "src/generated/graphql/schema.graphql",
  generate: {
    targets: ["mcp"],
    output: "../runa-mcp/src/generated",
    operations: "src/operations/**/*.graphql",
    mcp: {
      name: "runa-mcp",
      description:
        "Runa project management. Create tasks, manage boards, and track work.",
      tools: [
        {
          operation: "projects",
          name: "list_projects",
          description: "List all task boards in the organization",
        },
        {
          operation: "createTask",
          name: "create_task",
          description:
            "Create a new task on a project board. Supports title, description, priority, and assignee.",
        },
        {
          operation: "tasks",
          name: "list_tasks",
          description:
            "List and filter tasks. Filter by project, assignee, priority, column, or due date.",
        },
        {
          operation: "updateTask",
          name: "move_task",
          description:
            "Move a task to a different column or update its priority and assignee.",
        },
      ],
    },
  },
};
