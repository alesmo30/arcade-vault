import type { GameEngineFactory } from "./types";
import { createAsteroidsEngine } from "./asteroides/engine";
import { createTetrisEngine } from "./tetris/engine";

export const ENGINES: Record<string, GameEngineFactory> = {
  asteroides: createAsteroidsEngine,
  tetris: createTetrisEngine,
};
