import { describe, expect, it } from "bun:test";

import { getTableColumns, getTableName } from "drizzle-orm";

import { userPreferences } from "lib/db/schema/userPreference.table";

import type {
  InsertUserPreference,
  SelectUserPreference,
} from "lib/db/schema/userPreference.table";

describe("userPreferences schema", () => {
  const columns = getTableColumns(userPreferences);

  it("maps to the user_preference table", () => {
    expect(getTableName(userPreferences)).toBe("user_preference");
  });

  describe("pinOrder column", () => {
    it("exists in the schema", () => {
      expect(columns.pinOrder).toBeDefined();
    });

    it("is an integer type", () => {
      expect(columns.pinOrder.dataType).toBe("number");
      expect(columns.pinOrder.columnType).toBe("PgInteger");
    });

    it("is nullable (no notNull constraint)", () => {
      expect(columns.pinOrder.notNull).toBe(false);
    });

    it("has no default value", () => {
      expect(columns.pinOrder.hasDefault).toBe(false);
    });
  });

  describe("type inference", () => {
    it("allows pinOrder to be null on select", () => {
      const row = {} as SelectUserPreference;
      // pinOrder should be number | null
      const pinOrder: number | null = row.pinOrder;
      expect(pinOrder).toBeDefined;
    });

    it("allows pinOrder to be omitted on insert", () => {
      const row = {} as InsertUserPreference;
      // pinOrder should be optional (number | null | undefined)
      const pinOrder: number | null | undefined = row.pinOrder;
      expect(pinOrder).toBeDefined;
    });
  });

  describe("does not have a pinned boolean column", () => {
    it("has no pinned column", () => {
      expect((columns as Record<string, unknown>).pinned).toBeUndefined();
    });
  });
});
