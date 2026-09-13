import { describe, expect, it } from "bun:test";

import {
  buildManageNotificationsLink,
  buildTaskLink,
} from "lib/notifications/taskLink";

describe("buildTaskLink", () => {
  it("builds a task deep link", () => {
    expect(
      buildTaskLink({
        appBaseUrl: "https://runa.omni.dev",
        workspaceSlug: "acme",
        projectSlug: "web",
        prefix: "API",
        number: 42,
      }),
    ).toBe("https://runa.omni.dev/@acme/web/API-42");
  });

  it("trims a trailing slash on the base url", () => {
    expect(
      buildTaskLink({
        appBaseUrl: "https://runa.omni.dev/",
        workspaceSlug: "acme",
        projectSlug: "web",
        prefix: "API",
        number: 1,
      }),
    ).toBe("https://runa.omni.dev/@acme/web/API-1");
  });

  it("returns null when the base url is missing", () => {
    expect(
      buildTaskLink({
        appBaseUrl: undefined,
        workspaceSlug: "acme",
        projectSlug: "web",
        prefix: "API",
        number: 1,
      }),
    ).toBeNull();
  });

  it("url-encodes user-controlled segments so they cannot break out of an href", () => {
    const link = buildTaskLink({
      appBaseUrl: "https://runa.omni.dev",
      workspaceSlug: "acme",
      projectSlug: "web",
      prefix: '"><script',
      number: 7,
    });
    expect(link).not.toContain('"');
    expect(link).not.toContain("<");
    expect(link).toContain("%22%3E%3Cscript-7");
  });

  it("returns null when the workspace slug is unknown", () => {
    expect(
      buildTaskLink({
        appBaseUrl: "https://runa.omni.dev",
        workspaceSlug: undefined,
        projectSlug: "web",
        prefix: "API",
        number: 1,
      }),
    ).toBeNull();
  });
});

describe("buildManageNotificationsLink", () => {
  it("builds the workspace settings link", () => {
    expect(
      buildManageNotificationsLink({
        appBaseUrl: "https://runa.omni.dev",
        workspaceSlug: "acme",
      }),
    ).toBe("https://runa.omni.dev/@acme/~/settings");
  });

  it("returns null without a base url or slug", () => {
    expect(
      buildManageNotificationsLink({
        appBaseUrl: undefined,
        workspaceSlug: "acme",
      }),
    ).toBeNull();
    expect(
      buildManageNotificationsLink({
        appBaseUrl: "https://runa.omni.dev",
        workspaceSlug: undefined,
      }),
    ).toBeNull();
  });
});
