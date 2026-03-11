import { afterEach, describe, expect, mock, test } from "bun:test";

// Track container lifecycle calls
const mockExecInspect = mock(() => Promise.resolve({ ExitCode: 0 }));
const mockExecStart = mock(
  (_opts: unknown, cb: (err: null, stream: unknown) => void) => {
    // Create a mock stream that ends immediately with empty output
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    const stream = {
      on: mock((event: string, handler: (...args: unknown[]) => void) => {
        handlers[event] = handler;
        if (event === "end") {
          // Defer to allow stream.on("data") to be registered first
          setTimeout(() => handler(), 0);
        }
        return stream;
      }),
    };
    cb(null, stream);
  },
);

const mockContainerStart = mock(() => Promise.resolve());
const mockContainerStop = mock(() => Promise.resolve());
const mockContainerRemove = mock(() => Promise.resolve());
const mockContainerExec = mock(() =>
  Promise.resolve({
    start: mockExecStart,
    inspect: mockExecInspect,
  }),
);

const mockContainer = {
  id: "test-container-abc123",
  start: mockContainerStart,
  stop: mockContainerStop,
  remove: mockContainerRemove,
  exec: mockContainerExec,
};

const mockCreateContainer = mock(() => Promise.resolve(mockContainer));
const mockGetContainer = mock(() => mockContainer);

mock.module("dockerode", () => ({
  default: class MockDocker {
    createContainer = mockCreateContainer;
    getContainer = mockGetContainer;
  },
}));

// Import after mocks
const { createSandbox, execInSandbox, destroySandbox } = await import(
  "../sandbox"
);

const defaultConfig = {
  githubToken: "ghs_test_token",
  repoUrl: "https://github.com/omnidotdev/runa-api.git",
  branchName: "runa/t-42",
  baseBranch: "main",
};

type MockCalls = unknown[][];

describe("createSandbox", () => {
  afterEach(() => {
    mockCreateContainer.mockClear();
    mockContainerStart.mockClear();
    mockContainerExec.mockClear();
  });

  test("creates container with correct resource limits", async () => {
    await createSandbox(defaultConfig);

    expect(mockCreateContainer).toHaveBeenCalledTimes(1);
    const createArgs = (
      mockCreateContainer.mock.calls as MockCalls
    )[0]![0] as Record<string, Record<string, unknown>>;

    // Memory limit: 1GB
    expect(createArgs.HostConfig.Memory).toBe(1024 * 1024 * 1024);
    // CPU: 0.5 core
    expect(createArgs.HostConfig.CpuQuota).toBe(50_000);
    expect(createArgs.HostConfig.CpuPeriod).toBe(100_000);
    // Security
    expect(createArgs.HostConfig.SecurityOpt).toContain("no-new-privileges");
  });

  test("sets environment variables including GitHub token", async () => {
    await createSandbox(defaultConfig);

    const createArgs = (
      mockCreateContainer.mock.calls as MockCalls
    )[0]![0] as Record<string, unknown>;
    expect(createArgs.Env).toContain(
      `GITHUB_TOKEN=${defaultConfig.githubToken}`,
    );
    expect(createArgs.Env).toContain(`REPO_URL=${defaultConfig.repoUrl}`);
    expect(createArgs.Env).toContain(`BRANCH_NAME=${defaultConfig.branchName}`);
    expect(createArgs.Env).toContain(`BASE_BRANCH=${defaultConfig.baseBranch}`);
  });

  test("starts container after creation", async () => {
    await createSandbox(defaultConfig);
    expect(mockContainerStart).toHaveBeenCalledTimes(1);
  });

  test("runs git clone via execInSandbox", async () => {
    await createSandbox(defaultConfig);

    // exec is called for the clone command
    expect(mockContainerExec).toHaveBeenCalled();
    const execArgs = (
      mockContainerExec.mock.calls as MockCalls
    )[0]![0] as Record<string, string[]>;
    expect(execArgs.Cmd[0]).toBe("bash");
    expect(execArgs.Cmd[1]).toBe("-c");
    expect(execArgs.Cmd[2]).toContain("git clone");
  });

  test("returns container ID", async () => {
    const containerId = await createSandbox(defaultConfig);
    expect(containerId).toBe("test-container-abc123");
  });

  test("uses default image when SANDBOX_IMAGE not set", async () => {
    await createSandbox(defaultConfig);
    const createArgs = (
      mockCreateContainer.mock.calls as MockCalls
    )[0]![0] as Record<string, unknown>;
    expect(createArgs.Image).toBe("ghcr.io/omnidotdev/runa-sandbox:latest");
  });
});

describe("execInSandbox", () => {
  afterEach(() => {
    mockContainerExec.mockClear();
    mockExecStart.mockClear();
    mockExecInspect.mockClear();
  });

  test("calls container.exec with correct parameters", async () => {
    await execInSandbox("test-container-abc123", ["ls", "-la"]);

    expect(mockContainerExec).toHaveBeenCalledTimes(1);
    const execArgs = (
      mockContainerExec.mock.calls as MockCalls
    )[0]![0] as Record<string, unknown>;
    expect(execArgs.Cmd).toEqual(["ls", "-la"]);
    expect(execArgs.WorkingDir).toBe("/workspace");
    expect(execArgs.User).toBe("agent");
    expect(execArgs.AttachStdout).toBe(true);
    expect(execArgs.AttachStderr).toBe(true);
  });

  test("returns stdout, stderr, and exitCode", async () => {
    const result = await execInSandbox("test-container-abc123", ["echo", "hi"]);

    expect(result).toHaveProperty("stdout");
    expect(result).toHaveProperty("stderr");
    expect(result).toHaveProperty("exitCode");
    expect(result.exitCode).toBe(0);
  });

  test("rejects on exec.start failure", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: mock override needs flexible typing
    (mockExecStart as any).mockImplementationOnce(
      (_opts: unknown, cb: (err: Error | null, stream: unknown) => void) => {
        cb(new Error("exec start failed"), null);
      },
    );

    await expect(
      execInSandbox("test-container-abc123", ["bad-cmd"]),
    ).rejects.toThrow("exec start failed");
  });
});

describe("destroySandbox", () => {
  afterEach(() => {
    mockContainerStop.mockClear();
    mockContainerRemove.mockClear();
  });

  test("stops then removes container", async () => {
    await destroySandbox("test-container-abc123");

    expect(mockContainerStop).toHaveBeenCalledTimes(1);
    expect(mockContainerRemove).toHaveBeenCalledTimes(1);
  });

  test("does not throw if container already stopped", async () => {
    mockContainerStop.mockImplementationOnce(() =>
      Promise.reject(new Error("container already stopped")),
    );

    // Should not throw
    await destroySandbox("test-container-abc123");
    expect(mockContainerRemove).toHaveBeenCalledTimes(1);
  });

  test("does not throw if container already removed", async () => {
    mockGetContainer.mockImplementationOnce(() => {
      throw new Error("no such container");
    });

    // Should not throw (idempotent)
    await expect(destroySandbox("nonexistent")).resolves.toBeUndefined();
  });
});
