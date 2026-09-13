interface TaskLinkParams {
  /** Public origin of the web app, e.g. https://runa.omni.dev */
  appBaseUrl: string | undefined;
  /** Workspace (organization) slug, resolved from the org claim */
  workspaceSlug: string | undefined;
  /** Project slug */
  projectSlug: string;
  /** Project task-key prefix, e.g. "API"; null when the project has none */
  prefix: string | null;
  /** Per-project task number */
  number: number;
}

/**
 * Build the final task-key path segment for display (e.g. "API-42"), tolerating
 * a missing prefix. This is the human-readable key; for use inside a URL, encode
 * it (see buildTaskLink)
 */
export const buildTaskKeySegment = (
  prefix: string | null,
  number: number,
): string => (prefix ? `${prefix}-${number}` : String(number));

/**
 * Build a deep link to a task, mirroring the web app route
 * `/@{workspaceSlug}/{projectSlug}/{PREFIX}-{number}`.
 *
 * Only the task number is load-bearing in the final path segment (the prefix is
 * decorative and the slug self-heals on redirect). Returns null when the app
 * base URL or workspace slug is unknown, so callers can omit the link rather
 * than emit a broken one
 */
export const buildTaskLink = ({
  appBaseUrl,
  workspaceSlug,
  projectSlug,
  prefix,
  number,
}: TaskLinkParams): string | null => {
  if (!appBaseUrl || !workspaceSlug) return null;

  const base = appBaseUrl.replace(/\/+$/, "");

  // encode each dynamic segment: slug/prefix are user-controlled and land in an
  // email href, so a raw value could otherwise break out of the attribute
  const workspace = encodeURIComponent(workspaceSlug);
  const project = encodeURIComponent(projectSlug);
  const key = prefix
    ? `${encodeURIComponent(prefix)}-${number}`
    : String(number);

  return `${base}/@${workspace}/${project}/${key}`;
};

/**
 * Build a link to the workspace notification settings, used for the "manage
 * preferences" footer. Returns null when the app base URL or workspace slug is
 * unknown
 */
export const buildManageNotificationsLink = ({
  appBaseUrl,
  workspaceSlug,
}: Pick<TaskLinkParams, "appBaseUrl" | "workspaceSlug">): string | null => {
  if (!appBaseUrl || !workspaceSlug) return null;

  const base = appBaseUrl.replace(/\/+$/, "");

  return `${base}/@${encodeURIComponent(workspaceSlug)}/~/settings`;
};
