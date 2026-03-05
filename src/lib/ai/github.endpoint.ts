/**
 * GitHub integration REST endpoints.
 *
 * GET    /api/github/installation — Check GitHub App installation status
 * POST   /api/github/repos       — Connect a repository to a project
 * GET    /api/github/repos       — List connected repositories
 * DELETE /api/github/repos/:repoId — Disconnect a repository
 */

import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { githubInstallations, githubRepositories } from "lib/db/schema";
import { createInstallationOctokit } from "lib/github/client";
import { checkOrgAdmin, checkOrgMember, checkProjectAccess } from "./auth";
import { agentFeatureGuard, authGuard } from "./guards";

const githubRoutes = new Elysia({ prefix: "/api/github" })
  .use(agentFeatureGuard)
  .use(authGuard)
  /**
   * Check if GitHub App is installed for the organization.
   */
  .get(
    "/installation",
    async ({ query, auth, set }) => {
      const adminCheck = checkOrgAdmin(
        auth.organizations,
        query.organizationId,
        "view GitHub installation",
      );
      if (!adminCheck.ok) {
        set.status = adminCheck.status;
        return adminCheck.response;
      }

      const installation = await dbPool.query.githubInstallations.findFirst({
        where: eq(githubInstallations.organizationId, query.organizationId),
      });

      return {
        installed: !!installation?.enabled,
        githubOrgLogin: installation?.githubOrgLogin ?? null,
        installationId: installation?.installationId ?? null,
      };
    },
    {
      query: t.Object({
        organizationId: t.String(),
      }),
    },
  )
  /**
   * Connect a GitHub repository to a project.
   */
  .post(
    "/repos",
    async ({ body, auth, set }) => {
      const projectAccess = await checkProjectAccess(
        body.projectId,
        auth.organizations,
      );
      if (!projectAccess.ok) {
        set.status = projectAccess.status;
        return projectAccess.response;
      }

      const organizationId = projectAccess.value.organizationId;

      const adminCheck = checkOrgAdmin(
        auth.organizations,
        organizationId,
        "connect repositories",
      );
      if (!adminCheck.ok) {
        set.status = adminCheck.status;
        return adminCheck.response;
      }

      // Verify GitHub installation exists
      const installation = await dbPool.query.githubInstallations.findFirst({
        where: eq(githubInstallations.organizationId, organizationId),
      });

      if (!installation?.enabled) {
        set.status = 422;
        return { error: "GitHub App not installed for this organization" };
      }

      // Verify the repo exists and is accessible via the installation
      const [owner, repo] = body.repoFullName.split("/");
      if (!owner || !repo) {
        set.status = 400;
        return {
          error: "Invalid repository name. Expected format: owner/repo",
        };
      }

      try {
        const octokit = await createInstallationOctokit(
          installation.installationId,
        );
        const { data: repoData } = await octokit.repos.get({ owner, repo });

        // Check if project already has a connected repo
        const existing = await dbPool.query.githubRepositories.findFirst({
          where: eq(githubRepositories.projectId, body.projectId),
        });

        if (existing) {
          // Update existing connection
          const [updated] = await dbPool
            .update(githubRepositories)
            .set({
              repoFullName: repoData.full_name,
              repoId: repoData.id,
              defaultBranch: repoData.default_branch,
              enabled: true,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(githubRepositories.id, existing.id))
            .returning();

          return { repository: updated };
        }

        // Create new connection
        const [created] = await dbPool
          .insert(githubRepositories)
          .values({
            organizationId,
            projectId: body.projectId,
            repoFullName: repoData.full_name,
            repoId: repoData.id,
            defaultBranch: repoData.default_branch,
            enabled: true,
          })
          .returning();

        set.status = 201;
        return { repository: created };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";

        if (message.includes("Not Found")) {
          set.status = 404;
          return {
            error:
              "Repository not found or not accessible. Ensure the GitHub App has access to this repository.",
          };
        }

        console.error("[GitHub] Failed to connect repo:", err);
        set.status = 500;
        return { error: "Failed to connect repository" };
      }
    },
    {
      body: t.Object({
        projectId: t.String(),
        repoFullName: t.String(),
      }),
    },
  )
  /**
   * List connected repositories for a project.
   */
  .get(
    "/repos",
    async ({ query, auth, set }) => {
      const projectAccess = await checkProjectAccess(
        query.projectId,
        auth.organizations,
      );
      if (!projectAccess.ok) {
        set.status = projectAccess.status;
        return projectAccess.response;
      }

      const memberCheck = checkOrgMember(
        auth.organizations,
        projectAccess.value.organizationId,
      );
      if (!memberCheck.ok) {
        set.status = memberCheck.status;
        return memberCheck.response;
      }

      const repos = await dbPool
        .select()
        .from(githubRepositories)
        .where(
          and(
            eq(githubRepositories.projectId, query.projectId),
            eq(githubRepositories.enabled, true),
          ),
        );

      return { repositories: repos };
    },
    {
      query: t.Object({
        projectId: t.String(),
      }),
    },
  )
  /**
   * Disconnect a repository (soft-delete).
   */
  .delete(
    "/repos/:repoId",
    async ({ params, auth, set }) => {
      const repo = await dbPool.query.githubRepositories.findFirst({
        where: eq(githubRepositories.id, params.repoId),
      });

      if (!repo) {
        set.status = 404;
        return { error: "Repository not found" };
      }

      const adminCheck = checkOrgAdmin(
        auth.organizations,
        repo.organizationId,
        "disconnect repositories",
      );
      if (!adminCheck.ok) {
        set.status = adminCheck.status;
        return adminCheck.response;
      }

      await dbPool
        .update(githubRepositories)
        .set({
          enabled: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(githubRepositories.id, params.repoId));

      return { success: true };
    },
    {
      params: t.Object({
        repoId: t.String(),
      }),
    },
  );

export default githubRoutes;
