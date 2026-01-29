/**
 * Elysia auth guards for AI endpoints.
 *
 * These guards provide composable authentication and authorization
 * using Elysia's native guard() + resolve pattern.
 *
 * @example
 * ```ts
 * // Apply guards to an Elysia app
 * new Elysia({ prefix: "/api/ai/example" })
 *   .use(agentFeatureGuard)
 *   .use(authGuard)
 *   .get("/", async ({ auth }) => {
 *     // auth.user, auth.organizations, auth.accessToken available
 *     const check = checkOrgMember(auth.organizations, query.organizationId);
 *     // ...
 *   });
 * ```
 */

export { agentFeatureGuard } from "./agentFeature";
export { authGuard } from "./auth";
