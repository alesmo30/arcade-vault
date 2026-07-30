import type { GameEngineFactory } from "./types";
import { createAsteroidsEngine } from "./asteroides/engine";
import { createTetrisEngine } from "./tetris/engine";
import { createArkanoidEngine } from "./arkanoid/engine";
import { createSnakeEngine } from "./snake/engine";

export const ENGINES: Record<string, GameEngineFactory> = {
  asteroides: createAsteroidsEngine,
  tetris: createTetrisEngine,
  arkanoid: createArkanoidEngine,
  snake: createSnakeEngine,
};
