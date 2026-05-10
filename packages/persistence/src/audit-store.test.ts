import { describe, expect, it } from "vitest";
import { createMemoryAuditStore } from "./audit-store";

describe("createMemoryAuditStore", () => {
  it("按任务 id 存储任务事件", async () => {
    const store = createMemoryAuditStore();
    const event = {
      id: "event-1",
      taskId: "task-1",
      type: "audit" as const,
      message: "已创建任务",
      createdAt: "2026-05-10T00:00:00.000Z"
    };

    await store.appendEvent(event);

    expect(await store.listEvents("task-1")).toHaveLength(1);
    expect(await store.listEvents("task-2")).toEqual([]);
  });

  it("追加事件时保存快照", async () => {
    const store = createMemoryAuditStore();
    const event = {
      id: "event-1",
      taskId: "task-1",
      type: "audit" as const,
      message: "已创建任务",
      createdAt: "2026-05-10T00:00:00.000Z"
    };

    await store.appendEvent(event);
    event.message = "追加后被修改";

    expect(await store.listEvents("task-1")).toEqual([
      {
        id: "event-1",
        taskId: "task-1",
        type: "audit",
        message: "已创建任务",
        createdAt: "2026-05-10T00:00:00.000Z"
      }
    ]);
  });

  it("返回已存储事件的快照", async () => {
    const store = createMemoryAuditStore();

    await store.appendEvent({
      id: "event-1",
      taskId: "task-1",
      type: "audit",
      message: "已创建任务",
      createdAt: "2026-05-10T00:00:00.000Z"
    });

    const events = await store.listEvents("task-1");
    events[0].message = "列表返回后被修改";

    expect(await store.listEvents("task-1")).toEqual([
      {
        id: "event-1",
        taskId: "task-1",
        type: "audit",
        message: "已创建任务",
        createdAt: "2026-05-10T00:00:00.000Z"
      }
    ]);
  });
});
