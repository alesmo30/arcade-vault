import type { GameEngineFactory } from "./types";
import { createAsteroidsEngine } from "./asteroides/engine";

export const ENGINES: Record<string, GameEngineFactory> = {
  asteroides: createAsteroidsEngine,
};
