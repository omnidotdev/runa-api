/**
 * Agent marketplace REST endpoints.
 *
 * GET    /api/ai/marketplace               — Browse published listings
 * GET    /api/ai/marketplace/:id            — Get single listing with persona detail
 * POST   /api/ai/marketplace                — Publish a persona to the marketplace
 * POST   /api/ai/marketplace/:id/install    — Clone a listed persona into your org
 * DELETE /api/ai/marketplace/:id            — Unpublish a listing (own org only)
 */

import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { agentMarketplaceListings, agentPersonas } from "lib/db/schema";
import { isAgentEnabled } from "lib/flags";
import { authenticateRequest } from "./auth";

import type { AuthenticatedUser } from "./auth";

/** Valid marketplace listing categories. */
const VALID_CATEGORIES = [
  "triage",
  "sprint-planning",
  "standup",
  "code-review",
  "documentation",
  "reporting",
  "custom",
] as const;

type MarketplaceCategory = (typeof VALID_CATEGORIES)[number];

/** Max listing title length. */
const MAX_TITLE_LENGTH = 120;

/** Max listing description length. */
const MAX_DESCRIPTION_LENGTH = 1000;

/**
 * Verify the user is an admin/owner of the specified organization.
 */
function requireOrgAdmin(
  organizations: Array<{ id: string; roles: string[] }>,
  organizationId: string,
): { id: string; roles: string[] } {
  const orgClaim = organizations.find((org) => org.id === organizationId);
  if (!orgClaim) {
    throw new Error("Access denied to this organization");
  }
  const isAdmin =
    orgClaim.roles.includes("admin") || orgClaim.roles.includes("owner");
  if (!isAdmin) {
    throw new Error("Only organization admins can manage marketplace listings");
  }
  return orgClaim;
}

function isValidCategory(value: string): value is MarketplaceCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(value);
}

/** Max search query length to prevent abuse. */
const MAX_SEARCH_LENGTH = 200;

/** Default page size for browse results. */
const DEFAULT_PAGE_SIZE = 50;

/** Max page size for browse results. */
const MAX_PAGE_SIZE = 100;

/**
 * Escape SQL LIKE/ILIKE pattern characters so user input is treated literally.
 * Escapes `%`, `_`, and `\` with a preceding backslash.
 */
function escapeLikePattern(raw: string): string {
  return raw.replace(/[\\%_]/g, (char) => `\\${char}`);
}

const aiMarketplaceRoutes = new Elysia({ prefix: "/api/ai/marketplace" })
  // ── Browse listings ──────────────────────────────────────────────────────
  .get(
    "/",
    async ({ request, query, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      try {
        await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      // Validate category filter if provided
      if (query.category && !isValidCategory(query.category)) {
        set.status = 400;
        return {
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        };
      }

      const conditions = [];
      if (query.category) {
        conditions.push(eq(agentMarketplaceListings.category, query.category));
      }
      if (query.search) {
        const trimmed = query.search.slice(0, MAX_SEARCH_LENGTH).trim();
        if (trimmed) {
          conditions.push(
            ilike(
              agentMarketplaceListings.title,
              `%${escapeLikePattern(trimmed)}%`,
            ),
          );
        }
      }

      // Pagination
      const limit = Math.min(
        Math.max(Number(query.limit) || DEFAULT_PAGE_SIZE, 1),
        MAX_PAGE_SIZE,
      );
      const offset = Math.max(Number(query.offset) || 0, 0);

      const listings = await dbPool
        .select({
          id: agentMarketplaceListings.id,
          personaId: agentMarketplaceListings.personaId,
          organizationId: agentMarketplaceListings.organizationId,
          title: agentMarketplaceListings.title,
          description: agentMarketplaceListings.description,
          category: agentMarketplaceListings.category,
          installCount: agentMarketplaceListings.installCount,
          publishedAt: agentMarketplaceListings.publishedAt,
          // Include persona icon for display
          personaIcon: agentPersonas.icon,
        })
        .from(agentMarketplaceListings)
        .leftJoin(
          agentPersonas,
          eq(agentMarketplaceListings.personaId, agentPersonas.id),
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(agentMarketplaceListings.installCount))
        .limit(limit)
        .offset(offset);

      return {
        listings,
        pagination: { limit, offset, count: listings.length },
      };
    },
    {
      query: t.Object({
        category: t.Optional(t.String()),
        search: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        offset: t.Optional(t.String()),
      }),
    },
  )
  // ── Get single listing ───────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ request, params, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      try {
        await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      const rows = await dbPool
        .select({
          id: agentMarketplaceListings.id,
          personaId: agentMarketplaceListings.personaId,
          organizationId: agentMarketplaceListings.organizationId,
          title: agentMarketplaceListings.title,
          description: agentMarketplaceListings.description,
          category: agentMarketplaceListings.category,
          installCount: agentMarketplaceListings.installCount,
          publishedAt: agentMarketplaceListings.publishedAt,
          personaIcon: agentPersonas.icon,
          personaName: agentPersonas.name,
        })
        .from(agentMarketplaceListings)
        .leftJoin(
          agentPersonas,
          eq(agentMarketplaceListings.personaId, agentPersonas.id),
        )
        .where(eq(agentMarketplaceListings.id, params.id))
        .limit(1);

      if (rows.length === 0) {
        set.status = 404;
        return { error: "Listing not found" };
      }

      return { listing: rows[0] };
    },
    {
      params: t.Object({ id: t.String() }),
    },
  )
  // ── Publish a persona ────────────────────────────────────────────────────
  .post(
    "/",
    async ({ request, body, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      try {
        requireOrgAdmin(auth.organizations, body.organizationId);
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      if (!isValidCategory(body.category)) {
        set.status = 400;
        return {
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        };
      }

      // Verify persona exists and belongs to the organization
      const persona = await dbPool.query.agentPersonas.findFirst({
        where: (table, { eq: eqFn, and: andFn }) =>
          andFn(
            eqFn(table.id, body.personaId),
            eqFn(table.organizationId, body.organizationId),
          ),
      });
      if (!persona) {
        set.status = 404;
        return { error: "Persona not found in this organization" };
      }

      // Check for duplicate listing
      const existing = await dbPool.query.agentMarketplaceListings.findFirst({
        where: (table, { eq: eqFn }) => eqFn(table.personaId, body.personaId),
      });
      if (existing) {
        set.status = 409;
        return {
          error: "This persona is already published to the marketplace",
        };
      }

      const title = body.title.trim().slice(0, MAX_TITLE_LENGTH);
      if (!title) {
        set.status = 400;
        return { error: "Listing title is required" };
      }

      const [listing] = await dbPool
        .insert(agentMarketplaceListings)
        .values({
          personaId: body.personaId,
          organizationId: body.organizationId,
          title,
          description:
            body.description?.trim().slice(0, MAX_DESCRIPTION_LENGTH) ?? null,
          category: body.category,
        })
        .returning();

      set.status = 201;
      return { listing };
    },
    {
      body: t.Object({
        organizationId: t.String(),
        personaId: t.String(),
        title: t.String(),
        category: t.String(),
        description: t.Optional(t.String()),
      }),
    },
  )
  // ── Install a listing ────────────────────────────────────────────────────
  .post(
    "/:id/install",
    async ({ request, params, body, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      // Installing org admin check
      try {
        requireOrgAdmin(auth.organizations, body.organizationId);
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      // Find the listing
      const listing = await dbPool.query.agentMarketplaceListings.findFirst({
        where: (table, { eq: eqFn }) => eqFn(table.id, params.id),
      });
      if (!listing) {
        set.status = 404;
        return { error: "Listing not found" };
      }

      // Prevent self-install (org already owns the persona)
      if (listing.organizationId === body.organizationId) {
        set.status = 400;
        return {
          error: "Cannot install a persona published by your own organization",
        };
      }

      // Fetch the source persona to clone
      const sourcePersona = await dbPool.query.agentPersonas.findFirst({
        where: (table, { eq: eqFn }) => eqFn(table.id, listing.personaId),
      });
      if (!sourcePersona) {
        set.status = 404;
        return { error: "Source persona no longer exists" };
      }

      // Clone the persona into the installing org and increment install count.
      // The transaction ensures atomicity and the duplicate check prevents
      // race conditions from double-clicks.
      const result = await dbPool.transaction(async (tx) => {
        // Duplicate guard: check if org already has a persona with this exact name
        // from a prior install (prevents double-click / concurrent request dupes).
        const existingClone = await tx.query.agentPersonas.findFirst({
          where: (table, { eq: eqFn, and: andFn }) =>
            andFn(
              eqFn(table.organizationId, body.organizationId),
              eqFn(table.name, sourcePersona.name),
            ),
        });
        if (existingClone) {
          return { duplicate: true as const, persona: existingClone };
        }

        const [persona] = await tx
          .insert(agentPersonas)
          .values({
            organizationId: body.organizationId,
            name: sourcePersona.name,
            description: sourcePersona.description,
            systemPrompt: sourcePersona.systemPrompt,
            icon: sourcePersona.icon,
            enabled: true,
          })
          .returning();

        await tx
          .update(agentMarketplaceListings)
          .set({
            installCount: sql`${agentMarketplaceListings.installCount} + 1`,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(agentMarketplaceListings.id, params.id));

        return { duplicate: false as const, persona };
      });

      if (result.duplicate) {
        set.status = 409;
        return {
          error: "This persona has already been installed in your organization",
        };
      }

      const clonedPersona = result.persona;

      set.status = 201;
      return { persona: clonedPersona };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        organizationId: t.String(),
      }),
    },
  )
  // ── Unpublish a listing ──────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ request, params, body, set }) => {
      const enabled = await isAgentEnabled();
      if (!enabled) {
        set.status = 403;
        return { error: "Agent feature is not enabled" };
      }

      let auth: AuthenticatedUser;
      try {
        auth = await authenticateRequest(request);
      } catch (err) {
        set.status = 401;
        return {
          error: err instanceof Error ? err.message : "Authentication failed",
        };
      }

      try {
        requireOrgAdmin(auth.organizations, body.organizationId);
      } catch (err) {
        set.status = 403;
        return {
          error: err instanceof Error ? err.message : "Access denied",
        };
      }

      const deleted = await dbPool
        .delete(agentMarketplaceListings)
        .where(
          and(
            eq(agentMarketplaceListings.id, params.id),
            eq(agentMarketplaceListings.organizationId, body.organizationId),
          ),
        )
        .returning({ id: agentMarketplaceListings.id });

      if (deleted.length === 0) {
        set.status = 404;
        return { error: "Listing not found or not owned by this organization" };
      }

      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        organizationId: t.String(),
      }),
    },
  );

export default aiMarketplaceRoutes;
