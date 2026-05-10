import { describe, expect, it } from "vitest";
import { builtinPlugins, createPluginRegistry } from "./index";

describe("plugin registry", () => {
  it("registers MVP plugin metadata", () => {
    const registry = createPluginRegistry(builtinPlugins);

    expect(registry.get("file.scan")?.riskLevel).toBe("low");
    expect(registry.get("file.move")?.reversible).toBe(true);
    expect(registry.get("email.draft")?.riskLevel).toBe("medium");
    expect(registry.get("screen.locate")).toMatchObject({
      riskLevel: "low",
      reversible: false
    });
    expect(registry.get("mouse.move")).toMatchObject({
      riskLevel: "medium",
      reversible: false
    });
    expect(registry.get("clipboard.set")).toMatchObject({
      riskLevel: "high",
      reversible: false
    });
  });

  it("includes schema metadata for every built-in plugin", () => {
    expect(builtinPlugins.length).toBeGreaterThan(0);

    for (const plugin of builtinPlugins) {
      expect(plugin.inputSchema).toEqual({ type: "object" });
      expect(plugin.outputSchema).toEqual({ type: "object" });
    }
  });

  it("throws on duplicate plugin ids", () => {
    expect(() => createPluginRegistry([builtinPlugins[0], builtinPlugins[0]])).toThrow(
      "Duplicate plugin id"
    );
  });
});
