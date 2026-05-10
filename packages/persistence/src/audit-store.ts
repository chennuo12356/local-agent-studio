import type { TaskEvent } from "@local-agent/shared";

export type AuditStore = {
  appendEvent(event: TaskEvent): Promise<void>;
  listEvents(taskId: string): Promise<TaskEvent[]>;
};

export function createMemoryAuditStore(): AuditStore {
  const events: TaskEvent[] = [];

  return {
    async appendEvent(event: TaskEvent): Promise<void> {
      events.push(cloneTaskEvent(event));
    },
    async listEvents(taskId: string): Promise<TaskEvent[]> {
      return events.filter((event) => event.taskId === taskId).map(cloneTaskEvent);
    }
  };
}

function cloneTaskEvent(event: TaskEvent): TaskEvent {
  return { ...event };
}
