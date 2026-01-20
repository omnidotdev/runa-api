// TODO: Implement PostgreSQL Row-Level Security (RLS) policies for multi-tenant data isolation
// - Workspace data should only be accessible by workspace members
// - See: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

// TODO: Replace GraphQL-layer authorization with dedicated authZ engine
// - Current: Authorization plugins in src/lib/graphql/plugins/authorization/
// - Future: Integrate with authZ engine (e.g., OpenFGA, Ory Keto, or custom)

// TODO: Create audit_log table for tracking sensitive changes
// - Track: role changes, workspace access, task deletions
// - Fields: entityType, entityId, action, userId, changes (jsonb), createdAt

export * from "./assignee.table";
export * from "./column.table";
export * from "./emoji.table";
export * from "./label.table";
export * from "./post.table";
export * from "./project.table";
export * from "./projectColumn.table";
export * from "./settings.table";
export * from "./task.table";
export * from "./taskLabel.table";
export * from "./user.table";
export * from "./userOrganization.table";
export * from "./userPreference.table";
