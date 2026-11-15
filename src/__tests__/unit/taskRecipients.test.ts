import { describe, expect, it } from "bun:test";

import {
  involvedUserIds,
  isDeliverableEmail,
  selectRecipients,
} from "lib/notifications/taskRecipients";

import type { RecipientCandidate } from "lib/notifications/taskRecipients";

const user = (
  id: string,
  overrides: Partial<RecipientCandidate> = {},
): RecipientCandidate => ({
  id,
  identityProviderId: `idp-${id}`,
  email: `${id}@example.com`,
  name: id,
  preference: null,
  ...overrides,
});

describe("selectRecipients", () => {
  it("never emails the actor about their own action", () => {
    const result = selectRecipients({
      candidates: [user("actor"), user("dev")],
      kind: "comment",
      actorId: "actor",
    });
    expect(result.map((r) => r.id)).toEqual(["dev"]);
  });

  it("respects a per-kind opt-out and defaults to enabled", () => {
    const candidates = [
      user("off", { preference: { emailTaskComment: false } }),
      user("other-kind-off", { preference: { emailTaskMention: false } }),
      user("no-row"),
    ];
    const result = selectRecipients({
      candidates,
      kind: "comment",
      actorId: null,
    });
    expect(result.map((r) => r.id)).toEqual(["other-kind-off", "no-row"]);
  });

  it("gates each kind by its own preference", () => {
    const candidates = [
      user("a", { preference: { emailTaskMention: false } }),
      user("b", { preference: { emailTaskMoved: false } }),
    ];
    expect(
      selectRecipients({ candidates, kind: "mention", actorId: null }).map(
        (r) => r.id,
      ),
    ).toEqual(["b"]);
    expect(
      selectRecipients({ candidates, kind: "moved", actorId: null }).map(
        (r) => r.id,
      ),
    ).toEqual(["a"]);
  });

  it("drops excluded ids, stub addresses, and duplicates", () => {
    const result = selectRecipients({
      candidates: [
        user("mentioned"),
        user("stub", { email: "abc@users.runa.local" }),
        user("dev"),
        user("dev"),
      ],
      kind: "comment",
      actorId: null,
      excludeIds: ["mentioned"],
    });
    expect(result.map((r) => r.id)).toEqual(["dev"]);
  });
});

describe("isDeliverableEmail", () => {
  it("rejects missing and provisioning-stub addresses", () => {
    expect(isDeliverableEmail("dev@example.com")).toBe(true);
    expect(isDeliverableEmail("x@users.runa.local")).toBe(false);
    expect(isDeliverableEmail("")).toBe(false);
    expect(isDeliverableEmail(null)).toBe(false);
  });
});

describe("involvedUserIds", () => {
  it("unions author, assignees, and commenters without duplicates", () => {
    expect(
      involvedUserIds({
        authorId: "author",
        assigneeIds: ["dev", "author"],
        commenterIds: ["reviewer", null, "dev"],
      }),
    ).toEqual(["author", "dev", "reviewer"]);
  });

  it("tolerates a deleted author", () => {
    expect(
      involvedUserIds({ authorId: null, assigneeIds: [], commenterIds: [] }),
    ).toEqual([]);
  });
});
