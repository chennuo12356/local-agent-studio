import { describe, expect, it } from "vitest";
import { builtinPlugins, createPluginRegistry } from "./index";

describe("plugin registry", () => {
  it("registers MVP plugin metadata", () => {
    const registry = createPluginRegistry(builtinPlugins);

    expect(registry.get("file.scan")?.riskLevel).toBe("low");
    expect(registry.get("file.move")?.reversible).toBe(true);
    expect(registry.get("email.draft")?.riskLevel).toBe("medium");
  });

  it("throws on duplicate plugin ids", () => {
    expect(() => createPluginRegistry([builtinPlugins[0], builtinPlugins[0]])).toThrow(
      "Duplicate plugin id"
    );
  });
});
