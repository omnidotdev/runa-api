import { describe, expect, it } from "bun:test";

import { resolveAssignmentEmail } from "lib/notifications/assignmentEmail";

const input = {
  assignee: { id: "u-assignee", email: "dev@example.com", name: "Dev" },
  assigner: { id: "u-assigner", name: "Ada" },
  task: { content: "Fix login", number: 42 },
  project: {
    name: "Web",
    slug: "web",
    prefix: "API",
    organizationId: "org-1",
  },
  preference: null,
  workspaceSlug: "acme",
  appBaseUrl: "https://runa.omni.dev",
};

describe("resolveAssignmentEmail", () => {
  it("builds a well-formed payload on the happy path", () => {
    const result = resolveAssignmentEmail(input);
    expect(result).not.toBeNull();
    expect(result?.to).toBe("dev@example.com");
    expect(result?.subject).toBe("Ada assigned you API-42");
    expect(result?.html).toBe(true);
    expect(result?.body).toContain("https://runa.omni.dev/@acme/web/API-42");
    expect(result?.headers?.["List-Unsubscribe"]).toBe(
      "<https://runa.omni.dev/@acme/~/settings>",
    );
  });

  it("skips self-assignment", () => {
    expect(
      resolveAssignmentEmail({
        ...input,
        assigner: { id: "u-assignee", name: "Dev" },
      }),
    ).toBeNull();
  });

  it("skips when the assignee has opted out", () => {
    expect(
      resolveAssignmentEmail({
        ...input,
        preference: { emailTaskAssigned: false },
      }),
    ).toBeNull();
  });

  it("sends when a preference row exists and is enabled", () => {
    expect(
      resolveAssignmentEmail({
        ...input,
        preference: { emailTaskAssigned: true },
      }),
    ).not.toBeNull();
  });

  it("sends (default on) when no preference row exists", () => {
    expect(
      resolveAssignmentEmail({ ...input, preference: null }),
    ).not.toBeNull();
  });

  it("skips when the assignee has no email", () => {
    expect(
      resolveAssignmentEmail({
        ...input,
        assignee: { id: "u-assignee", email: null, name: "Dev" },
      }),
    ).toBeNull();
  });

  it("still sends without a resolvable task link (CTA omitted)", () => {
    const result = resolveAssignmentEmail({
      ...input,
      workspaceSlug: undefined,
    });
    expect(result).not.toBeNull();
    expect(result?.body).not.toContain("View task");
  });
});
