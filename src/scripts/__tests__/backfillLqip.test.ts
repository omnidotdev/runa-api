import { describe, expect, it, mock } from "bun:test";

import {
  avatarLqipUpdate,
  backfillTarget,
  backgroundLqipUpdate,
} from "../backfillLqip";

import type { BackfillTarget } from "../backfillLqip";

interface Row {
  id: string;
  lqip: string | null;
  /** What the mock storage holds for this row */
  object: "image" | "missing" | "broken" | "hang";
}

/** In-memory table plus storage, mirroring the real target's contract */
const fakeTarget = (rows: Row[]) => {
  const table = new Map(rows.map((row) => [row.id, { ...row }]));
  const write = mock(async (row: Row, lqip: string) => {
    const current = table.get(row.id);
    // Mirrors `where id = $1 and lqip is null`
    if (!current || current.lqip !== null) return false;
    current.lqip = lqip;
    return true;
  });

  const target: BackfillTarget<Row> = {
    name: "test.lqip",
    fetchBatch: async (afterId, limit) =>
      [...table.values()]
        .filter((row) => row.lqip === null)
        .filter((row) => afterId === null || row.id > afterId)
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, limit)
        .map((row) => ({ ...row })),
    readImage: async (row) => {
      if (row.object === "missing") return null;
      if (row.object === "broken") throw new Error("boom");
      if (row.object === "hang") return new Promise<Buffer>(() => undefined);
      return Buffer.from(`bytes-${row.id}`);
    },
    write,
  };

  return { table, target, write };
};

const makeLqip = async (bytes: Buffer) =>
  `data:image/webp;base64,${bytes.toString("base64")}`;

const options = { makeLqip, batchSize: 2, timeoutMs: 50, log: () => {} };

describe("backfillTarget", () => {
  it("fills only rows missing a preview and keeps going past failures", async () => {
    const { table, target } = fakeTarget([
      { id: "a", lqip: null, object: "image" },
      { id: "b", lqip: "data:image/webp;base64,AAAA", object: "image" },
      { id: "c", lqip: null, object: "missing" },
      { id: "d", lqip: null, object: "broken" },
      { id: "e", lqip: null, object: "hang" },
      { id: "f", lqip: null, object: "image" },
    ]);

    const summary = await backfillTarget(target, { ...options, dryRun: false });

    expect(summary).toEqual({ scanned: 5, filled: 2, skipped: 1, failed: 2 });
    expect(table.get("a")?.lqip).toBe(await makeLqip(Buffer.from("bytes-a")));
    expect(table.get("f")?.lqip).toBe(await makeLqip(Buffer.from("bytes-f")));
    // Never overwrites an existing preview
    expect(table.get("b")?.lqip).toBe("data:image/webp;base64,AAAA");
    expect(table.get("c")?.lqip).toBeNull();
  });

  it("is a no-op on a second run", async () => {
    const { target, write } = fakeTarget([
      { id: "a", lqip: null, object: "image" },
    ]);

    await backfillTarget(target, { ...options, dryRun: false });
    const rerun = await backfillTarget(target, { ...options, dryRun: false });

    expect(rerun).toEqual({ scanned: 0, filled: 0, skipped: 0, failed: 0 });
    expect(write).toHaveBeenCalledTimes(1);
  });

  it("counts a row filled meanwhile as skipped", async () => {
    const { table, target } = fakeTarget([
      { id: "a", lqip: null, object: "image" },
    ]);
    const readImage = target.readImage;
    target.readImage = async (row, signal) => {
      const bytes = await readImage(row, signal);
      // Another writer fills the preview while the image is being read
      const current = table.get(row.id);
      if (current) current.lqip = "data:image/webp;base64,BBBB";
      return bytes;
    };

    const summary = await backfillTarget(target, { ...options, dryRun: false });

    expect(summary).toEqual({ scanned: 1, filled: 0, skipped: 1, failed: 0 });
    expect(table.get("a")?.lqip).toBe("data:image/webp;base64,BBBB");
  });

  it("writes nothing on a dry run", async () => {
    const { table, target, write } = fakeTarget([
      { id: "a", lqip: null, object: "image" },
      { id: "b", lqip: null, object: "missing" },
      { id: "c", lqip: null, object: "image" },
    ]);

    const summary = await backfillTarget(target, { ...options, dryRun: true });

    expect(summary).toEqual({ scanned: 3, filled: 2, skipped: 1, failed: 0 });
    expect(write).not.toHaveBeenCalled();
    expect([...table.values()].every((row) => row.lqip === null)).toBe(true);
  });

  it("skips an image no preview can be made for", async () => {
    const { target, write } = fakeTarget([
      { id: "a", lqip: null, object: "image" },
    ]);

    const summary = await backfillTarget(target, {
      ...options,
      dryRun: false,
      makeLqip: async () => null,
    });

    expect(summary).toEqual({ scanned: 1, filled: 0, skipped: 1, failed: 0 });
    expect(write).not.toHaveBeenCalled();
  });
});

describe("preview updates", () => {
  it("only fill a still-empty avatar preview of an unchanged avatar", () => {
    const { sql } = avatarLqipUpdate(
      { id: "p1", image: "https://api/x" },
      "data:image/webp;base64,AAAA",
    ).toSQL();

    expect(sql).toContain('set "image_lqip" = $1');
    expect(sql).toContain('"project"."image_lqip" is null');
    expect(sql).toContain('"project"."image" = $');
    expect(sql).not.toContain("updated_at");
  });

  it("only fill a still-empty background preview of an unchanged background", () => {
    const { sql } = backgroundLqipUpdate(
      { id: "p1", assetId: "runa/org/backgrounds/x.png" },
      "data:image/webp;base64,AAAA",
    ).toSQL();

    expect(sql).toContain("jsonb_set(");
    expect(sql).toContain(`"project"."background" ->> 'lqip' is null`);
    expect(sql).toContain(`"project"."background" ->> 'assetId' = $`);
    expect(sql).not.toContain("updated_at");
  });
});
