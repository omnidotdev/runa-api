/**
 * Agent persona REST endpoints.
 *
 * GET    /api/ai/personas?organizationId=xxx — List org personas
 * POST   /api/ai/personas                   — Create a persona
 * PUT    /api/ai/personas/:id                — Update a persona
 * DELETE /api/ai/personas/:id                — Delete a persona
 */

import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { dbPool } from "lib/db/db";
import { agentConfigs, agentPersonas } from "lib/db/schema";
import { checkOrgAdmin, checkOrgMember } from "./auth";
import {
  MAX_PERSONA_DESCRIPTION_LENGTH,
  MAX_PERSONA_NAME_LENGTH,
  MAX_PERSONA_SYSTEM_PROMPT_LENGTH,
} from "./constants";
import { agentFeatureGuard, authGuard } from "./guards";

import type { InsertAgentPersona } from "lib/db/schema";

const aiPersonaRoutes = new Elysia({ prefix: "/api/ai/personas" })
  .use(agentFeatureGuard)
  .use(authGuard)
  .get(
    "/",
    async ({ query, auth, set }) => {
      const memberCheck = checkOrgMember(
        auth.organizations,
        query.organizationId,
      );
      if (!memberCheck.ok) {
        set.status = memberCheck.status;
        return memberCheck.response;
      }

      const personas = await dbPool.query.agentPersonas.findMany({
        where: (table, { eq: eqFn }) =>
          eqFn(table.organizationId, query.organizationId),
        orderBy: (table, { asc }) => asc(table.name),
      });

      return { personas };
    },
    {
      query: t.Object({
        organizationId: t.String(),
      }),
    },
  )
  .post(
    "/",
    async ({ body, auth, set }) => {
      const adminCheck = checkOrgAdmin(
        auth.organizations,
        body.organizationId,
        "manage personas",
      );
      if (!adminCheck.ok) {
        set.status = adminCheck.status;
        return adminCheck.response;
      }

      const name = body.name.trim().slice(0, MAX_PERSONA_NAME_LENGTH);
      if (!name) {
        set.status = 400;
        return { error: "Persona name is required" };
      }

      const systemPrompt = body.systemPrompt
        .trim()
        .slice(0, MAX_PERSONA_SYSTEM_PROMPT_LENGTH);
      if (!systemPrompt) {
        set.status = 400;
        return { error: "System prompt is required" };
      }

      const [persona] = await dbPool
        .insert(agentPersonas)
        .values({
          organizationId: body.organizationId,
          name,
          description:
            body.description?.trim().slice(0, MAX_PERSONA_DESCRIPTION_LENGTH) ??
            null,
          systemPrompt,
          icon: body.icon?.slice(0, 10) ?? null,
          enabled: body.enabled ?? true,
        })
        .returning();

      set.status = 201;
      return { persona };
    },
    {
      body: t.Object({
        organizationId: t.String(),
        name: t.String(),
        systemPrompt: t.String(),
        description: t.Optional(t.String()),
        icon: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, auth, set }) => {
      const adminCheck = checkOrgAdmin(
        auth.organizations,
        body.organizationId,
        "manage personas",
      );
      if (!adminCheck.ok) {
        set.status = adminCheck.status;
        return adminCheck.response;
      }

      // Verify persona belongs to the organization
      const existing = await dbPool.query.agentPersonas.findFirst({
        where: (table, { eq: eqFn, and: andFn }) =>
          andFn(
            eqFn(table.id, params.id),
            eqFn(table.organizationId, body.organizationId),
          ),
      });
      if (!existing) {
        set.status = 404;
        return { error: "Persona not found" };
      }

      const updates: Partial<InsertAgentPersona> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.name !== undefined) {
        const name = body.name.trim().slice(0, MAX_PERSONA_NAME_LENGTH);
        if (!name) {
          set.status = 400;
          return { error: "Persona name cannot be empty" };
        }
        updates.name = name;
      }

      if (body.systemPrompt !== undefined) {
        const systemPrompt = body.systemPrompt
          .trim()
          .slice(0, MAX_PERSONA_SYSTEM_PROMPT_LENGTH);
        if (!systemPrompt) {
          set.status = 400;
          return { error: "System prompt cannot be empty" };
        }
        updates.systemPrompt = systemPrompt;
      }

      if (body.description !== undefined) {
        updates.description =
          body.description === null
            ? null
            : body.description.trim().slice(0, MAX_PERSONA_DESCRIPTION_LENGTH);
      }

      if (body.icon !== undefined) {
        updates.icon = body.icon ? body.icon.slice(0, 10) : null;
      }

      if (body.enabled !== undefined) {
        updates.enabled = body.enabled;
      }

      const [updated] = await dbPool
        .update(agentPersonas)
        .set(updates)
        .where(
          and(
            eq(agentPersonas.id, params.id),
            eq(agentPersonas.organizationId, body.organizationId),
          ),
        )
        .returning();

      return { persona: updated };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        organizationId: t.String(),
        name: t.Optional(t.String()),
        systemPrompt: t.Optional(t.String()),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        icon: t.Optional(t.Union([t.String(), t.Null()])),
        enabled: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, body, auth, set }) => {
      const adminCheck = checkOrgAdmin(
        auth.organizations,
        body.organizationId,
        "manage personas",
      );
      if (!adminCheck.ok) {
        set.status = adminCheck.status;
        return adminCheck.response;
      }

      const deleted = await dbPool
        .delete(agentPersonas)
        .where(
          and(
            eq(agentPersonas.id, params.id),
            eq(agentPersonas.organizationId, body.organizationId),
          ),
        )
        .returning({ id: agentPersonas.id });

      if (deleted.length === 0) {
        set.status = 404;
        return { error: "Persona not found" };
      }

      // Clear defaultPersonaId if it pointed to the deleted persona
      await dbPool
        .update(agentConfigs)
        .set({
          defaultPersonaId: null,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(agentConfigs.organizationId, body.organizationId),
            eq(agentConfigs.defaultPersonaId, params.id),
          ),
        );

      return { success: true };
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        organizationId: t.String(),
      }),
    },
  );

export default aiPersonaRoutes;
