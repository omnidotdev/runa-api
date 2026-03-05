/**
 * Docker sandbox manager for code execution.
 *
 * Creates isolated containers for agent code execution with
 * resource limits, non-root user, and automatic cleanup.
 */

import Docker from "dockerode";

import { SANDBOX_IMAGE } from "lib/config/env.config";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const DEFAULT_SANDBOX_IMAGE = "ghcr.io/omnidotdev/runa-sandbox:latest";
const MEMORY_LIMIT_BYTES = 1024 * 1024 * 1024; // 1GB
const CPU_QUOTA = 50_000; // 0.5 CPU (50% of one core, period is 100000)
const CPU_PERIOD = 100_000;
const SAFETY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ─────────────────────────────────────────────
// Docker Client
// ─────────────────────────────────────────────

const docker = new Docker();

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SandboxConfig {
  /** GitHub token for clone/push operations. Injected as env var only. */
  githubToken: string;
  /** Repository to clone (e.g., "https://github.com/omnidotdev/runa-api.git"). */
  repoUrl: string;
  /** Branch name to checkout. */
  branchName: string;
  /** Base branch to create from. */
  baseBranch: string;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// ─────────────────────────────────────────────
// Sandbox Lifecycle
// ─────────────────────────────────────────────

/**
 * Create a sandboxed Docker container for code execution.
 *
 * Container runs with:
 * - 1GB memory limit
 * - 0.5 CPU limit
 * - Non-root user (agent, uid 1000)
 * - no-new-privileges security option
 * - 30-minute auto-kill safety net
 * - GitHub token as env var (never logged)
 */
export async function createSandbox(config: SandboxConfig): Promise<string> {
  const image = SANDBOX_IMAGE || DEFAULT_SANDBOX_IMAGE;

  const container = await docker.createContainer({
    Image: image,
    Env: [
      `GITHUB_TOKEN=${config.githubToken}`,
      `REPO_URL=${config.repoUrl}`,
      `BRANCH_NAME=${config.branchName}`,
      `BASE_BRANCH=${config.baseBranch}`,
    ],
    WorkingDir: "/workspace",
    HostConfig: {
      Memory: MEMORY_LIMIT_BYTES,
      CpuQuota: CPU_QUOTA,
      CpuPeriod: CPU_PERIOD,
      SecurityOpt: ["no-new-privileges"],
      NetworkMode: "bridge",
    },
  });

  await container.start();

  // Safety net: auto-kill after 30 minutes
  const containerId = container.id;
  setTimeout(() => {
    destroySandbox(containerId).catch(() => {
      // Container may already be destroyed
    });
  }, SAFETY_TIMEOUT_MS);

  // Clone the repository and checkout feature branch
  await execInSandbox(
    containerId,
    [
      "bash",
      "-c",
      `git clone --depth=50 "https://x-access-token:$GITHUB_TOKEN@${config.repoUrl.replace("https://", "")}" . && git checkout -b "$BRANCH_NAME" "origin/$BASE_BRANCH"`,
    ],
    120_000, // 2 minutes for clone
  );

  return containerId;
}

/**
 * Execute a command inside a sandbox container.
 *
 * Returns stdout, stderr, and exit code.
 * Enforces a timeout to prevent runaway processes.
 */
export async function execInSandbox(
  containerId: string,
  command: string[],
  timeoutMs = 30_000,
): Promise<ExecResult> {
  const container = docker.getContainer(containerId);

  const exec = await container.exec({
    Cmd: command,
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: "/workspace",
    User: "agent",
  });

  return new Promise<ExecResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    exec.start({ hijack: true, stdin: false }, (err, stream) => {
      if (err || !stream) {
        clearTimeout(timeout);
        reject(err ?? new Error("Failed to start exec stream"));
        return;
      }

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      // Docker multiplexes stdout/stderr in a single stream with 8-byte headers
      stream.on("data", (chunk: Buffer) => {
        // Header: [type(1), 0, 0, 0, size(4)]
        // type: 1 = stdout, 2 = stderr
        let offset = 0;

        while (offset < chunk.length) {
          if (offset + 8 > chunk.length) break;

          const type = chunk[offset];
          const size = chunk.readUInt32BE(offset + 4);
          const payload = chunk.subarray(offset + 8, offset + 8 + size);

          if (type === 1) {
            stdoutChunks.push(payload);
          } else if (type === 2) {
            stderrChunks.push(payload);
          }

          offset += 8 + size;
        }
      });

      stream.on("end", () => {
        clearTimeout(timeout);

        exec
          .inspect()
          .then((inspectData) => {
            resolve({
              stdout: Buffer.concat(stdoutChunks).toString("utf-8"),
              stderr: Buffer.concat(stderrChunks).toString("utf-8"),
              exitCode: inspectData.ExitCode ?? 1,
            });
          })
          .catch((inspectErr) => {
            reject(inspectErr);
          });
      });

      stream.on("error", (streamErr: Error) => {
        clearTimeout(timeout);
        reject(streamErr);
      });
    });
  });
}

/**
 * Destroy a sandbox container. Safe to call if already stopped/removed.
 */
export async function destroySandbox(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 5 }).catch(() => {
      // Container may already be stopped
    });
    await container.remove({ force: true });
  } catch {
    // Container may already be removed — safe to ignore
  }
}
