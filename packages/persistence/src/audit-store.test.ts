import { describe, expect, it } from "vitest";
import { createMemoryAuditStore } from "./audit-store";

describe("createMemoryAuditStore", () => {
  it("stores task events by task id", async () => {
    const store = createMemoryAuditStore();
    const event = {
      id: "event-1",
      taskId: "task-1",
      type: "audit" as const,
      message: "created task",
      createdAt: "2026-05-10T00:00:00.000Z"
    };

    await store.appendEvent(event);

    expect(await store.listEvents("task-1")).toHaveLength(1);
    expect(await store.listEvents("task-2")).toEqual([]);
  });

  it("snapshots events when they are appended", async () => {
    const store = createMemoryAuditStore();
    const event = {
      id: "event-1",
      taskId: "task-1",
      type: "audit" as const,
      message: "created task",
      createdAt: "2026-05-10T00:00:00.000Z"
    };

    await store.appendEvent(event);
    event.message = "mutated after append";

    expect(await store.listEvents("task-1")).toEqual([
      {
        id: "event-1",
        taskId: "task-1",
        type: "audit",
        message: "created task",
        createdAt: "2026-05-10T00:00:00.000Z"
      }
    ]);
  });

  it("returns snapshots of stored events", async () => {
    const store = createMemoryAuditStore();

    await store.appendEvent({
      id: "event-1",
      taskId: "task-1",
      type: "audit",
      message: "created task",
      createdAt: "2026-05-10T00:00:00.000Z"
    });

    const events = await store.listEvents("task-1");
    events[0].message = "mutated after list";

    expect(await store.listEvents("task-1")).toEqual([
      {
        id: "event-1",
        taskId: "task-1",
        type: "audit",
        message: "created task",
        createdAt: "2026-05-10T00:00:00.000Z"
      }
    ]);
  });
});
