import { describe, expect, it } from "bun:test";

import {
  buildTaskCommentEmail,
  buildTaskMentionEmail,
  buildTaskMovedEmail,
} from "lib/notifications/templates/taskActivity";

const base = {
  actorName: "Ada",
  taskTitle: "Fix login",
  taskDisplayKey: "API-42",
  projectName: "Web",
  taskUrl: "https://runa.omni.dev/@acme/web/API-42",
  manageUrl: "https://runa.omni.dev/@acme/~/settings",
};

describe("buildTaskCommentEmail", () => {
  it("names the commenter and task, quotes the comment, and links to it", () => {
    const { subject, html } = buildTaskCommentEmail({
      ...base,
      commentText: "Looks good to me",
    });
    expect(subject).toBe("Ada commented on API-42");
    expect(html).toContain("Looks good to me");
    expect(html).toContain(base.taskUrl);
    expect(html).toContain("commented on this task");
  });

  it("escapes user-controlled text", () => {
    const { html } = buildTaskCommentEmail({
      ...base,
      actorName: "<script>",
      commentText: "<img src=x onerror=alert(1)>",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("keeps a CR/LF in a name out of the subject header", () => {
    const { subject } = buildTaskCommentEmail({
      ...base,
      actorName: "Ada\r\nBcc: victim@example.com",
      commentText: "hi",
    });
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("truncates long comments", () => {
    const { html } = buildTaskCommentEmail({
      ...base,
      commentText: "x".repeat(1000),
    });
    expect(html).not.toContain("x".repeat(400));
    expect(html).toContain("…");
  });
});

describe("buildTaskMentionEmail", () => {
  it("says where the mention happened", () => {
    expect(
      buildTaskMentionEmail({ ...base, source: "comment", contentText: "hey" })
        .html,
    ).toContain("a comment on a task");
    const description = buildTaskMentionEmail({
      ...base,
      source: "description",
      contentText: "hey",
    });
    expect(description.subject).toBe("Ada mentioned you in API-42");
    expect(description.html).toContain("a task description");
    expect(description.html).toContain("you were mentioned");
  });

  it("falls back to a generic actor and omits a missing link", () => {
    const { subject, html } = buildTaskMentionEmail({
      ...base,
      actorName: null,
      taskUrl: null,
      source: "comment",
      contentText: "",
    });
    expect(subject).toBe("Someone mentioned you in API-42");
    expect(html).not.toContain("View task");
  });
});

describe("buildTaskMovedEmail", () => {
  it("shows the old key, both projects, and the new key", () => {
    const { subject, html } = buildTaskMovedEmail({
      ...base,
      taskDisplayKey: "MOB-7",
      projectName: "Mobile",
      previousDisplayKey: "API-42",
      fromProjectName: "Web",
    });
    expect(subject).toBe("Ada moved API-42 to Mobile");
    expect(html).toContain("MOB-7");
    expect(html).toContain("Web");
  });
});
