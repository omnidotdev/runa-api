import { EXPORTABLE } from "graphile-export";
import { TYPES, listOfCodec } from "postgraphile/@dataplan/pg";
import { sql } from "postgraphile/@dataplan/pg/pg-sql2";
import { constant, context, lambda } from "postgraphile/grafast";
import { wrapPlans } from "postgraphile/utils";

import type { PgSelectStep } from "postgraphile/@dataplan/pg";

/**
 * Read-side access scoping for every GraphQL read of workspace data.
 *
 * Postgraphile exposes each table's rows through root queries, nested
 * relations, `node(id)`, and mutation payloads. Mutations are authorized per
 * operation by the authorization plugins, but reads had no row filter at all,
 * so any caller (anonymous included) could list every workspace's projects,
 * tasks, comments, and users. Each rule here is a resource `selectAuth`: a
 * condition grafast attaches to EVERY select of that table, whichever path
 * reaches it.
 *
 * Who can see what:
 * - a project is visible when it is public or belongs to one of the reader's
 *   workspaces (session organization claims, or the single workspace an API
 *   token was issued for)
 * - project content (tasks, columns, labels, links, comments, assignees,
 *   attachments, emoji) is visible through a visible project
 * - workspace-level rows (status columns, workspace labels, settings) need
 *   workspace membership; they are never public
 * - a user row is visible to that user, and to readers who can see a task or
 *   comment the user authored, is assigned to, or reacted to
 * - personal preference rows are visible only to their owner
 */

/** Per-request reader identity used by every rule */
const readerOrgIds = EXPORTABLE(
  (context, lambda) => () =>
    lambda(context(), (ctx) => {
      // biome-ignore lint/suspicious/noExplicitAny: grafast context shape
      const c = ctx as any;
      // an API token reads only the workspace it was issued for
      if (c.apiTokenPrincipal) return [c.apiTokenPrincipal.organizationId];
      if (!c.observer) return [];
      return ((c.organizations ?? []) as { id: string }[]).map((org) => org.id);
    }),
  [context, lambda],
);

const readerUserId = EXPORTABLE(
  (context, lambda) => () =>
    lambda(
      context(),
      // biome-ignore lint/suspicious/noExplicitAny: grafast context shape
      (ctx) => ((ctx as any).observer?.id as string | undefined) ?? null,
    ),
  [context, lambda],
);

/** SQL for the ids of projects the reader can see */
const visibleProjectIds = EXPORTABLE(
  (sql, listOfCodec, TYPES, readerOrgIds) =>
    // biome-ignore lint/suspicious/noExplicitAny: any resource's select step
    ($step: PgSelectStep<any>) => {
      const orgs = $step.placeholder(readerOrgIds(), listOfCodec(TYPES.text));
      return sql`(select p.id from public.project p where p.organization_id = any(${orgs}) or p.is_public)`;
    },
  [sql, listOfCodec, TYPES, readerOrgIds],
);

/** SQL for the ids of tasks the reader can see */
const visibleTaskIds = EXPORTABLE(
  (sql, visibleProjectIds) =>
    // biome-ignore lint/suspicious/noExplicitAny: any resource's select step
    ($step: PgSelectStep<any>) =>
      sql`(select t.id from public.task t where t.project_id in ${visibleProjectIds($step)})`,
  [sql, visibleProjectIds],
);

// biome-ignore lint/suspicious/noExplicitAny: any resource's select step
type SelectAuth = ($step: PgSelectStep<any>) => void;

const projectAuth: SelectAuth = EXPORTABLE(
  (sql, listOfCodec, TYPES, readerOrgIds) => ($step) => {
    const orgs = $step.placeholder(readerOrgIds(), listOfCodec(TYPES.text));
    $step.where(
      sql`(${$step.alias}.organization_id = any(${orgs}) or ${$step.alias}.is_public)`,
    );
  },
  [sql, listOfCodec, TYPES, readerOrgIds],
);

const byProjectAuth: SelectAuth = EXPORTABLE(
  (sql, visibleProjectIds) => ($step) => {
    $step.where(sql`${$step.alias}.project_id in ${visibleProjectIds($step)}`);
  },
  [sql, visibleProjectIds],
);

const byTaskAuth: SelectAuth = EXPORTABLE(
  (sql, visibleTaskIds) => ($step) => {
    $step.where(sql`${$step.alias}.task_id in ${visibleTaskIds($step)}`);
  },
  [sql, visibleTaskIds],
);

const byWorkspaceAuth: SelectAuth = EXPORTABLE(
  (sql, listOfCodec, TYPES, readerOrgIds) => ($step) => {
    const orgs = $step.placeholder(readerOrgIds(), listOfCodec(TYPES.text));
    $step.where(sql`${$step.alias}.organization_id = any(${orgs})`);
  },
  [sql, listOfCodec, TYPES, readerOrgIds],
);

/** Workspace-wide labels need membership; project labels follow the project */
const labelAuth: SelectAuth = EXPORTABLE(
  (sql, listOfCodec, TYPES, readerOrgIds, visibleProjectIds) => ($step) => {
    const orgs = $step.placeholder(readerOrgIds(), listOfCodec(TYPES.text));
    $step.where(
      sql`(${$step.alias}.project_id in ${visibleProjectIds($step)} or (${$step.alias}.project_id is null and ${$step.alias}.organization_id = any(${orgs})))`,
    );
  },
  [sql, listOfCodec, TYPES, readerOrgIds, visibleProjectIds],
);

const emojiAuth: SelectAuth = EXPORTABLE(
  (sql, visibleTaskIds) => ($step) => {
    $step.where(
      sql`${$step.alias}.post_id in (select po.id from public.post po where po.task_id in ${visibleTaskIds($step)})`,
    );
  },
  [sql, visibleTaskIds],
);

const userAuth: SelectAuth = EXPORTABLE(
  (sql, TYPES, readerUserId, visibleTaskIds) => ($step) => {
    const self = $step.placeholder(readerUserId(), TYPES.uuid);
    const tasks = visibleTaskIds($step);
    const u = $step.alias;
    $step.where(
      sql`(${u}.id = ${self}
        or ${u}.id in (select t.author_id from public.task t where t.id in ${tasks})
        or ${u}.id in (select a.user_id from public.assignee a where a.task_id in ${tasks})
        or ${u}.id in (select po.author_id from public.post po where po.task_id in ${tasks})
        or ${u}.id in (select e.user_id from public.emoji e join public.post po on po.id = e.post_id where po.task_id in ${tasks}))`,
    );
  },
  [sql, TYPES, readerUserId, visibleTaskIds],
);

const ownerOnlyAuth: SelectAuth = EXPORTABLE(
  (sql, TYPES, readerUserId) => ($step) => {
    const self = $step.placeholder(readerUserId(), TYPES.uuid);
    $step.where(sql`${$step.alias}.user_id = ${self}`);
  },
  [sql, TYPES, readerUserId],
);

/** Table name to its read rule; a workspace-data table missing here is a gap */
const READ_RULES: Record<string, SelectAuth> = {
  project: projectAuth,
  task: byProjectAuth,
  column: byProjectAuth,
  project_link: byProjectAuth,
  project_project_label: byProjectAuth,
  label: labelAuth,
  post: byTaskAuth,
  assignee: byTaskAuth,
  task_label: byTaskAuth,
  attachment: byTaskAuth,
  emoji: emojiAuth,
  project_column: byWorkspaceAuth,
  project_label: byWorkspaceAuth,
  settings: byWorkspaceAuth,
  user: userAuth,
  user_preference: ownerOnlyAuth,
  notification_preference: ownerOnlyAuth,
};

const ReadScopePlugin: GraphileConfig.Plugin = {
  name: "RunaReadScopePlugin",
  version: "0.0.0",
  description: "Scopes every GraphQL read of workspace data to the reader",
  gather: {
    hooks: {
      pgTables_PgResourceOptions(_info, event) {
        const rule = READ_RULES[event.pgClass.relname];
        if (rule) event.resourceOptions.selectAuth = rule;
      },
    },
  },
};

/**
 * Email addresses are hidden from the API, but the unique-constraint lookup
 * `userByEmail` survives as a root field; neutralize it so it cannot be used to
 * test whether an address belongs to a user
 */
export const UserByEmailLookupPlugin = wrapPlans({
  Query: {
    userByEmail: EXPORTABLE((constant) => () => constant(null), [constant]),
  },
});

export default ReadScopePlugin;
