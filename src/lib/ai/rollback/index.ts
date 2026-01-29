/**
 * Agent rollback module.
 *
 * Provides types and logic for reverting agent write operations.
 */

export { applyRollback } from "./logic";
export { isBatchSnapshot } from "./types";

export type {
  BatchSnapshot,
  SingleSnapshot,
  Snapshot,
  TaskSnapshot,
} from "./types";
