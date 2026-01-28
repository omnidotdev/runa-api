import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { generateDefaultDate, generateDefaultId } from "lib/db/util";
import { agentPersonas } from "./agentPersona.table";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Agent marketplace listing table.
 *
 * Represents a persona published to the shared marketplace. Other organizations
 * can browse and "install" listings, which clones the persona into their own
 * `agent_persona` table. Install counts are tracked for popularity ranking.
 */
export const agentMarketplaceListings = pgTable(
  "agent_marketplace_listing",
  {
    id: generateDefaultId(),
    /** The persona this listing publishes. */
    personaId: uuid()
      .notNull()
      .references(() => agentPersonas.id, { onDelete: "cascade" }),
    /** The organization that published this listing. */
    organizationId: text().notNull(),

    title: text().notNull(),
    description: text(),
    /** Categorizes the listing for browse/filter (e.g. "triage", "sprint-planning"). */
    category: text().notNull(),

    /** Number of times this listing has been installed by other organizations. */
    installCount: integer().notNull().default(0),

    publishedAt: generateDefaultDate(),
    createdAt: generateDefaultDate(),
    updatedAt: generateDefaultDate(),
  },
  (table) => [
    uniqueIndex().on(table.id),
    index("agent_marketplace_listing_category_idx").on(table.category),
    index("agent_marketplace_listing_organization_id_idx").on(
      table.organizationId,
    ),
    // Prevent duplicate listings of the same persona
    uniqueIndex("agent_marketplace_listing_persona_id_uniq").on(
      table.personaId,
    ),
  ],
);

export type InsertAgentMarketplaceListing = InferInsertModel<
  typeof agentMarketplaceListings
>;
export type SelectAgentMarketplaceListing = InferSelectModel<
  typeof agentMarketplaceListings
>;
