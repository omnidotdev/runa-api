import { Elysia } from "elysia";

export const webhooks = new Elysia({ prefix: "/webhooks" }).post(
  "/stripe",
  "TODO",
);
