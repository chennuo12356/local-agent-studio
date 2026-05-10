import { describe, expect, it } from "vitest";
import { builtinPlugins, createPluginRegistry } from "./index";

describe("插件注册表", () => {
  it("注册 MVP 插件元数据", () => {
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

  it("每个内置插件都包含 schema 元数据", () => {
    expect(builtinPlugins.length).toBeGreaterThan(0);

    for (const plugin of builtinPlugins) {
      expect(plugin.inputSchema).toEqual({ type: "object" });
      expect(plugin.outputSchema).toEqual({ type: "object" });
    }
  });

  it("遇到重复插件 id 时抛出错误", () => {
    expect(() => createPluginRegistry([builtinPlugins[0], builtinPlugins[0]])).toThrow(
      "插件 id 重复"
    );
  });
});
