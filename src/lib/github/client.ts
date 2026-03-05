/**
 * GitHub App client with installation token caching.
 *
 * Provides authenticated Octokit instances for GitHub API operations
 * using GitHub App installation tokens with 55-minute TTL cache.
 */

import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

import { GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY } from "lib/config/env.config";

// ─────────────────────────────────────────────
// Token Cache
// ─────────────────────────────────────────────

interface CachedToken {
  token: string;
  expiresAt: number;
}

/** In-memory token cache. Installation tokens are valid for 1 hour; we cache for 55 minutes. */
const TOKEN_CACHE_TTL_MS = 55 * 60 * 1000;
const tokenCache = new Map<number, CachedToken>();

/**
 * Get a GitHub App installation token, with in-memory caching.
 *
 * Tokens are cached for 55 minutes (GitHub tokens expire after 60).
 * Never persisted to DB — only lives in process memory.
 */
export async function getInstallationToken(
  installationId: number,
): Promise<string> {
  const cached = tokenCache.get(installationId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const privateKey = decodePrivateKey();
  const auth = createAppAuth({
    appId: GITHUB_APP_ID!,
    privateKey,
  });

  const { token } = await auth({
    type: "installation",
    installationId,
  });

  tokenCache.set(installationId, {
    token,
    expiresAt: Date.now() + TOKEN_CACHE_TTL_MS,
  });

  return token;
}

// ─────────────────────────────────────────────
// Octokit Factory
// ─────────────────────────────────────────────

/**
 * Create an authenticated Octokit instance for a GitHub App installation.
 */
export async function createInstallationOctokit(
  installationId: number,
): Promise<Octokit> {
  const token = await getInstallationToken(installationId);

  return new Octokit({ auth: token });
}

// ─────────────────────────────────────────────
// Pull Request Creation
// ─────────────────────────────────────────────

interface CreatePullRequestParams {
  installationId: number;
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
}

interface PullRequestResult {
  prUrl: string;
  prNumber: number;
}

/**
 * Create a pull request on GitHub via the App installation.
 */
export async function createPullRequest(
  params: CreatePullRequestParams,
): Promise<PullRequestResult> {
  const octokit = await createInstallationOctokit(params.installationId);

  const { data } = await octokit.pulls.create({
    owner: params.owner,
    repo: params.repo,
    title: params.title,
    body: params.body,
    head: params.head,
    base: params.base,
  });

  return {
    prUrl: data.html_url,
    prNumber: data.number,
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Decode the private key from base64 or return as-is if already PEM-formatted.
 */
function decodePrivateKey(): string {
  const key = GITHUB_APP_PRIVATE_KEY;

  if (!key) {
    throw new Error("GITHUB_APP_PRIVATE_KEY is not configured");
  }

  // If it starts with the PEM header, it's already decoded
  if (key.startsWith("-----BEGIN")) {
    return key;
  }

  // Otherwise, decode from base64
  return Buffer.from(key, "base64").toString("utf-8");
}

/**
 * Invalidate cached token for an installation (e.g., on uninstall).
 */
export function invalidateInstallationToken(installationId: number): void {
  tokenCache.delete(installationId);
}
