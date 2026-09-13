import { describe, expect, it } from "bun:test";

import { buildTaskAssignedEmail } from "lib/notifications/templates/taskAssigned";

const base = {
  assignerName: "Ada Lovelace",
  taskTitle: "Fix the login flow",
  taskDisplayKey: "API-42",
  projectName: "Web",
  taskUrl: "https://runa.omni.dev/@acme/web/API-42",
  manageUrl: "https://runa.omni.dev/@acme/~/settings",
};

describe("buildTaskAssignedEmail", () => {
  it("names the assigner and task key in the subject", () => {
    const { subject } = buildTaskAssignedEmail(base);
    expect(subject).toBe("Ada Lovelace assigned you API-42");
  });

  it("falls back to a generic subject when the assigner is unknown", () => {
    const { subject } = buildTaskAssignedEmail({ ...base, assignerName: null });
    expect(subject).toBe("You were assigned API-42");
  });

  it("includes the project, title, CTA link and manage link", () => {
    const { html } = buildTaskAssignedEmail(base);
    expect(html).toContain("Web");
    expect(html).toContain("Fix the login flow");
    expect(html).toContain('href="https://runa.omni.dev/@acme/web/API-42"');
    expect(html).toContain("View task");
    expect(html).toContain('href="https://runa.omni.dev/@acme/~/settings"');
  });

  it("omits the CTA button when there is no task url", () => {
    const { html } = buildTaskAssignedEmail({ ...base, taskUrl: null });
    expect(html).not.toContain("View task");
    // still renders the rest of the email
    expect(html).toContain("Fix the login flow");
  });

  it("escapes html in user-supplied fields", () => {
    const { html } = buildTaskAssignedEmail({
      ...base,
      taskTitle: '<script>alert("x")</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("collapses internal whitespace in the title", () => {
    const { html } = buildTaskAssignedEmail({
      ...base,
      taskTitle: "hello    world",
    });
    expect(html).toContain("hello world");
  });

  it("truncates a very long title with an ellipsis", () => {
    const long = `${"a ".repeat(200)}end`;
    const { html } = buildTaskAssignedEmail({ ...base, taskTitle: long });
    expect(html).toContain("…");
  });
});
