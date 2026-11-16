import { describe, expect, it, mock } from "bun:test";

import { fetchTaskActivity } from "../taskActivity";

const TASK_ID = "550e8400-e29b-41d4-a716-446655440002";

const okFetch = () =>
  mock(
    async () =>
      new Response(JSON.stringify({ data: { resourceActivity: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );

describe("fetchTaskActivity", () => {
  it("authenticates to Chronicle with runa's service key", async () => {
    const fetchImpl = okFetch();

    await fetchTaskActivity({
      organizationId: "org-1",
      taskId: TASK_ID,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      apiUrl: "https://chronicle.test",
      serviceKey: "runa-service-key",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://chronicle.test/graphql");
    expect((init.headers as Record<string, string>).authorization).toBe(
      "Bearer runa-service-key",
    );
    expect(JSON.parse(init.body as string).variables).toMatchObject({
      organizationId: "org-1",
      resourceId: TASK_ID,
    });
  });

  it("skips Chronicle without a service key", async () => {
    const fetchImpl = okFetch();

    const entries = await fetchTaskActivity({
      organizationId: "org-1",
      taskId: TASK_ID,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      apiUrl: "https://chronicle.test",
      serviceKey: "",
    });

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(Array.isArray(entries)).toBe(true);
  });
});
