import type { SkinId } from "./skins";

export type EngineStatus = "playing" | "dead" | "gameover" | "paused";

export type EngineState = {
  score: number;
  lives: number;
  level: number;
  status: EngineStatus;
};

export type ControlAction = "left" | "right" | "up" | "down" | "a" | "b";

export type GameEngine = {
  pause(): void;
  resume(): void;
  restart(): void;
  endNow(): void;
  destroy(): void;
  /** Cambia la paleta visual activa. Cosmético: no reinicia ni altera la partida en curso. */
  setSkin?(skin: SkinId): void;
  /** Entrada táctil. Equivale a mantener/soltar la tecla correspondiente. */
  setControl?(action: ControlAction, pressed: boolean): void;
};

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  onState: (state: EngineState) => void,
  initialSkin?: SkinId,
) => GameEngine;
