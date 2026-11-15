/**
 * Recipient selection for task-activity emails. Pure: takes already-loaded
 * candidates and returns who should be emailed, so the rules are unit-testable
 * without a database.
 *
 * Model: people *involved* in a task (its creator, assignees, and prior
 * commenters) hear about comments and moves; anyone @mentioned hears about the
 * mention. Nobody is emailed about their own action, and nothing is broadcast
 * to the whole workspace
 */

/** The task-activity email kinds, each gated by its own preference */
export type TaskEmailKind = "comment" | "mention" | "moved";

/** Preference column that gates each kind (opt-out model, default on) */
const PREFERENCE_KEY = {
  comment: "emailTaskComment",
  mention: "emailTaskMention",
  moved: "emailTaskMoved",
} as const satisfies Record<TaskEmailKind, string>;

type PreferenceKey = (typeof PREFERENCE_KEY)[TaskEmailKind];

/** A user who might be emailed, with their notification preference row */
export interface RecipientCandidate {
  /** Local user id */
  id: string;
  /** Identity-provider user id (used for the access check) */
  identityProviderId: string;
  email: string | null;
  name: string | null;
  /** Null when the user has no preference row yet (everything enabled) */
  preference: Partial<Record<PreferenceKey, boolean>> | null;
}

/**
 * Placeholder domain for stub users provisioned before a member's first sign-in
 * (see UserIdResolver). These addresses are not real mailboxes
 */
const STUB_EMAIL_DOMAIN = "@users.runa.local";

/** Whether an address is a real, sendable mailbox (not a provisioning stub) */
export const isDeliverableEmail = (
  email: string | null | undefined,
): email is string =>
  !!email && email.includes("@") && !email.endsWith(STUB_EMAIL_DOMAIN);

interface SelectRecipientsParams {
  candidates: RecipientCandidate[];
  kind: TaskEmailKind;
  /** Local id of the user who acted; never emailed about their own action */
  actorId: string | null | undefined;
  /** Local ids to leave out (e.g. people already getting a mention email) */
  excludeIds?: Iterable<string>;
}

/**
 * Filter candidates down to recipients: drop the actor, explicit exclusions,
 * undeliverable addresses, and anyone who opted out of this kind, then dedupe.
 * Access to the task is checked separately (it needs the authorization service)
 */
export const selectRecipients = ({
  candidates,
  kind,
  actorId,
  excludeIds = [],
}: SelectRecipientsParams): RecipientCandidate[] => {
  const excluded = new Set(excludeIds);
  const key = PREFERENCE_KEY[kind];
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    if (seen.has(candidate.id)) return false;
    seen.add(candidate.id);

    if (actorId && candidate.id === actorId) return false;
    if (excluded.has(candidate.id)) return false;
    if (!isDeliverableEmail(candidate.email)) return false;

    // respect an explicit opt-out; a missing row or column means enabled
    return candidate.preference?.[key] !== false;
  });
};

/**
 * Local user ids of everyone involved in a task: its creator, its assignees,
 * and anyone who has commented on it. Order-preserving and deduplicated
 */
export const involvedUserIds = ({
  authorId,
  assigneeIds,
  commenterIds,
}: {
  authorId: string | null | undefined;
  assigneeIds: (string | null | undefined)[];
  commenterIds: (string | null | undefined)[];
}): string[] => {
  const ids = new Set<string>();
  for (const id of [authorId, ...assigneeIds, ...commenterIds]) {
    if (id) ids.add(id);
  }
  return [...ids];
};
