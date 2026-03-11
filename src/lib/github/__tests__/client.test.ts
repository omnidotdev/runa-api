import { afterEach, describe, expect, mock, test } from "bun:test";

// env.config is mocked globally via preload.ts

// Mock @octokit/auth-app
const mockAuth = mock(() => Promise.resolve({ token: "ghs_mock_token_123" }));

mock.module("@octokit/auth-app", () => ({
  createAppAuth: mock(() => mockAuth),
}));

// Mock @octokit/rest
const mockPullsCreate = mock(() =>
  Promise.resolve({
    data: {
      html_url: "https://github.com/org/repo/pull/42",
      number: 42,
    },
  }),
);

mock.module("@octokit/rest", () => ({
  Octokit: class MockOctokit {
    pulls = { create: mockPullsCreate };
  },
}));

// Import after mocks are set up
const { getInstallationToken, createPullRequest, invalidateInstallationToken } =
  await import("../client");

describe("getInstallationToken", () => {
  afterEach(() => {
    invalidateInstallationToken(1);
    invalidateInstallationToken(2);
    mockAuth.mockClear();
  });

  test("returns token from auth provider on first call", async () => {
    const token = await getInstallationToken(1);
    expect(token).toBe("ghs_mock_token_123");
    expect(mockAuth).toHaveBeenCalledTimes(1);
  });

  test("returns cached token on subsequent calls", async () => {
    await getInstallationToken(1);
    await getInstallationToken(1);
    expect(mockAuth).toHaveBeenCalledTimes(1);
  });

  test("fetches separate tokens for different installations", async () => {
    await getInstallationToken(1);
    await getInstallationToken(2);
    expect(mockAuth).toHaveBeenCalledTimes(2);
  });
});

describe("invalidateInstallationToken", () => {
  afterEach(() => {
    invalidateInstallationToken(1);
    mockAuth.mockClear();
  });

  test("clears cached token so next call fetches fresh", async () => {
    await getInstallationToken(1);
    expect(mockAuth).toHaveBeenCalledTimes(1);

    invalidateInstallationToken(1);

    await getInstallationToken(1);
    expect(mockAuth).toHaveBeenCalledTimes(2);
  });
});

describe("createPullRequest", () => {
  afterEach(() => {
    invalidateInstallationToken(1);
    mockPullsCreate.mockClear();
  });

  test("calls octokit.pulls.create with correct params", async () => {
    const result = await createPullRequest({
      installationId: 1,
      owner: "omnidotdev",
      repo: "runa-api",
      title: "feat: add auth",
      body: "Implements authentication",
      head: "runa/t-42",
      base: "main",
    });

    expect(result).toEqual({
      prUrl: "https://github.com/org/repo/pull/42",
      prNumber: 42,
    });

    expect(mockPullsCreate).toHaveBeenCalledWith({
      owner: "omnidotdev",
      repo: "runa-api",
      title: "feat: add auth",
      body: "Implements authentication",
      head: "runa/t-42",
      base: "main",
    });
  });
});
