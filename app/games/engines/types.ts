export type EngineStatus = "playing" | "dead" | "gameover" | "paused";

export type EngineState = {
  score: number;
  lives: number;
  level: number;
  status: EngineStatus;
};

export type GameEngine = {
  pause(): void;
  resume(): void;
  restart(): void;
  endNow(): void;
  destroy(): void;
};

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  onState: (state: EngineState) => void,
) => GameEngine;
