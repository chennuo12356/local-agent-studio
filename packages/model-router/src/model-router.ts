export type ModelPurpose = "planning" | "text" | "vision" | string;

export interface ModelRouterConfig {
  planning: string;
  text: string;
  vision: string;
}

export interface ModelRouter {
  selectModel(purpose: ModelPurpose): string;
}

export function createModelRouter(config: ModelRouterConfig): ModelRouter {
  return {
    selectModel(purpose) {
      if (purpose === "planning") {
        return config.planning;
      }

      if (purpose === "vision") {
        return config.vision;
      }

      return config.text;
    }
  };
}
