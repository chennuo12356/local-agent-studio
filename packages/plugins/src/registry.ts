import type { ToolPlugin } from "@local-agent/shared";

export type PluginRegistry = {
  list(): ToolPlugin[];
  get(id: string): ToolPlugin | undefined;
};

export function createPluginRegistry(plugins: ToolPlugin[]): PluginRegistry {
  const byId = new Map<string, ToolPlugin>();

  for (const plugin of plugins) {
    if (byId.has(plugin.id)) {
      throw new Error(`Duplicate plugin id: ${plugin.id}`);
    }

    byId.set(plugin.id, plugin);
  }

  return {
    list: () => [...byId.values()],
    get: (id: string) => byId.get(id)
  };
}
