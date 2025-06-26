import { drizzle } from "drizzle-orm/node-postgres";
import { reset, seed } from "drizzle-seed";

import { DATABASE_URL, isDevEnv } from "lib/config/env.config";
import * as schema from "lib/db/schema";

/**
 * Seed a database with sample data.
 */
const seedDatabase = async () => {
  if (!isDevEnv || !DATABASE_URL?.includes("localhost")) {
    // biome-ignore lint/suspicious/noConsoleLog: script logging
    console.log("This script can only be run in development");
    process.exit(1);
  }

  const db = drizzle(DATABASE_URL, { casing: "snake_case" });
  await reset(db, schema);

  // biome-ignore lint/suspicious/noConsoleLog: script logging
  console.log("Seeding database...");

  await seed(db, schema, { count: 50 }).refine((f) => ({
    columnTable: {
      columns: {
        title: f.valuesFromArray({
          values: [
            "Backlog",
            "To Do",
            "In Progress",
            "Awaiting Review",
            "Done",
          ],
        }),
      },
      with: {
        taskTable: [
          { weight: 0.6, count: [1, 2, 3, 4] },
          { weight: 0.2, count: [5, 6, 7, 8, 9, 10] },
          { weight: 0.15, count: [11, 12, 13, 14, 15, 16, 17] },
          { weight: 0.05, count: [18, 19, 20, 21, 22, 23, 24, 25] },
        ],
      },
    },
    postTable: {
      columns: {
        title: f.valuesFromArray({
          values: [
            "The Future of Web Development: A Look Ahead",
            "Mastering React Hooks: A Comprehensive Guide",
            "Drizzle ORM: Simplifying Your Database Interactions",
            "Building Scalable APIs with Node.js and Express",
            "CSS-in-JS: Styling Your React Applications",
            "Demystifying Authentication in Modern Web Apps",
            "Exploring the Benefits of Serverless Architectures",
            "Optimizing Database Performance: Tips and Tricks",
            "Understanding Asynchronous JavaScript: Callbacks, Promises, and Async/Await",
            "Deploying Your First Full-Stack Application",
          ],
        }),
        description: f.loremIpsum({ sentencesCount: 3 }),
      },
    },
    projectTable: {
      columns: {
        name: f.companyName(),
        description: f.loremIpsum(),
        prefix: f.default({
          defaultValue: "SEED",
        }),
        color: f.valuesFromArray({
          values: [
            "#fb2c36",
            "#ff6900",
            "#ffdf20",
            "#05df72",
            "#2b7fff",
            "#4f39f6",
            "#7f22fe",
          ],
        }),
        viewMode: f.valuesFromArray({ values: ["board", "list"] }),
        labels: f.default({
          defaultValue: [
            { name: "Frontend", color: "orange" },
            { name: "Design", color: "teal" },
            { name: "Backend", color: "green" },
            { name: "Database", color: "purple" },
            { name: "DevOps", color: "blue" },
            { name: "Testing", color: "red" },
            { name: "Bug", color: "indigo" },
            { name: "Urgent", color: "rose" },
            { name: "Feature", color: "emerald" },
            { name: "Refactor", color: "yellow" },
          ],
        }),
      },
      with: {
        columnTable: 5,
      },
    },
    taskTable: {
      columns: {
        content: f.valuesFromArray({
          values: [
            "Implement User Authentication",
            "Design Database Schema for Products",
            "Develop Frontend Product Listing Page",
            "Set Up CI/CD Pipeline",
            "Write Unit Tests for API Endpoints",
            "Refactor Old User Service Module",
            "Create Admin Dashboard UI",
            "Integrate Payment Gateway",
            "Optimize Image Loading Performance",
            "Conduct User Acceptance Testing (UAT)",
          ],
        }),
        description: f.loremIpsum(),
        priority: f.valuesFromArray({ values: ["low", "medium", "high"] }),
        labels: f.valuesFromArray({
          values: [
            JSON.stringify([
              { name: "Frontend", color: "orange" },
              { name: "Design", color: "teal" },
            ]),
            JSON.stringify([
              { name: "Backend", color: "green" },
              { name: "Database", color: "purple" },
            ]),
            JSON.stringify([{ name: "DevOps", color: "blue" }]),
            JSON.stringify([
              { name: "Testing", color: "red" },
              { name: "Bug", color: "indigo" },
            ]),
            JSON.stringify([
              { name: "Urgent", color: "rose" },
              { name: "Feature", color: "emerald" },
              { name: "Refactor", color: "yellow" },
            ]),
          ],
        }),
        columnIndex: f.int({
          minValue: 0,
          maxValue: 100,
        }),
      },
      with: {
        assigneeTable: 3,
      },
    },
    userTable: {
      columns: {
        name: f.firstName(),
        avatarUrl: f.default({
          defaultValue:
            "https://helios-i.mashable.com/imagery/articles/05SzGlYqpD4cUlIaQ8DHdVF/hero-image.fill.size_1200x1200.v1666999270.jpg",
        }),
      },
    },
    workspaceTable: {
      columns: {
        name: f.companyName(),
      },
    },
  }));

  // biome-ignore lint/suspicious/noConsoleLog: script logging
  console.log("Database seeded successfully!");
};

await seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
