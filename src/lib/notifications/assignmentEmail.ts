import {
  buildManageNotificationsLink,
  buildTaskKeySegment,
  buildTaskLink,
} from "lib/notifications/taskLink";
import { buildTaskAssignedEmail } from "lib/notifications/templates/taskAssigned";

import type { EmailParams } from "@omnidotdev/providers";

interface ResolveAssignmentEmailInput {
  /** The user being assigned */
  assignee: { id: string; email: string | null; name: string | null } | null;
  /** The actor who performed the assignment (the observer) */
  assigner: { id: string; name: string | null } | null;
  /** The task the user was assigned to */
  task: { content: string; number: number | null } | null;
  /** The project the task belongs to */
  project: {
    name: string;
    slug: string;
    prefix: string | null;
    organizationId: string;
  } | null;
  /** The assignee's notification preference row, or null when none exists */
  preference: { emailTaskAssigned: boolean } | null;
  /** Workspace (organization) slug for the task's org, if resolvable */
  workspaceSlug: string | undefined;
  /** Public origin of the web app */
  appBaseUrl: string | undefined;
}

/**
 * Decide whether to send a task-assignment email and, if so, build the message.
 * Pure: takes already-fetched data and returns the provider payload or null.
 *
 * Skip rules:
 * - self-assignment (assignee is the assigner)
 * - the assignee has opted out (emailTaskAssigned === false)
 * - missing assignee email, task, or project (defensive)
 *
 * A missing preference row means all notifications are enabled (opt-out model)
 */
export const resolveAssignmentEmail = ({
  assignee,
  assigner,
  task,
  project,
  preference,
  workspaceSlug,
  appBaseUrl,
}: ResolveAssignmentEmailInput): EmailParams | null => {
  if (!assignee?.email || !task || !project) return null;

  // do not email someone for assigning themselves
  if (assigner && assigner.id === assignee.id) return null;

  // respect an explicit opt-out; absence of a row defaults to enabled
  if (preference && !preference.emailTaskAssigned) return null;

  const displayKey =
    task.number != null
      ? buildTaskKeySegment(project.prefix, task.number)
      : (project.prefix ?? "");

  const taskUrl =
    task.number != null
      ? buildTaskLink({
          appBaseUrl,
          workspaceSlug,
          projectSlug: project.slug,
          prefix: project.prefix,
          number: task.number,
        })
      : null;

  const manageUrl = buildManageNotificationsLink({ appBaseUrl, workspaceSlug });

  const { subject, html } = buildTaskAssignedEmail({
    assignerName: assigner?.name,
    taskTitle: task.content,
    taskDisplayKey: displayKey,
    projectName: project.name,
    taskUrl,
    manageUrl,
  });

  const params: EmailParams = {
    to: assignee.email,
    subject,
    body: html,
    html: true,
  };

  // one-click unsubscribe hint pointing at the authenticated settings page
  if (manageUrl) params.headers = { "List-Unsubscribe": `<${manageUrl}>` };

  return params;
};
