import { drizzle } from "drizzle-orm/node-postgres";
import { reset } from "drizzle-seed";

import { DATABASE_URL, isDevEnv } from "lib/config/env.config";
import * as schema from "lib/db/schema";

/**
 * Seed a database with sample data.
 *
 * TODO: Fix drizzle-seed configuration - table names don't match schema exports.
 * The seed() function expects table names like "columnTable" but schema exports "columns".
 * For now, this script only resets the database.
 */
const seedDatabase = async () => {
  if (!isDevEnv || !DATABASE_URL?.includes("localhost")) {
    // biome-ignore lint/suspicious/noConsole: script logging
    console.log("This script can only be run in development");
    process.exit(1);
  }

  const db = drizzle(DATABASE_URL, { casing: "snake_case" });
  await reset(db, schema);

  // biome-ignore lint/suspicious/noConsole: script logging
  console.log("Database reset. Seeding disabled - see TODO in this file.");
};

await seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
