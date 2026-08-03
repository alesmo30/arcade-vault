import type { ControlAction } from "./types";

export type PadButton = { action: ControlAction; label: string };

export type PadLayout = {
  /** Direcciones que el D-pad muestra. Las no listadas no se dibujan. */
  dpad: ControlAction[];
  /** 0, 1 o 2 botones de acción. */
  buttons: PadButton[];
};

export const CONTROLS: Record<string, PadLayout> = {
  asteroides: { dpad: ["left", "right", "up"], buttons: [{ action: "a", label: "DISPARO" }] },
  tetris: {
    dpad: ["left", "right", "down"],
    buttons: [
      { action: "a", label: "ROTAR" },
      { action: "b", label: "CAER" },
    ],
  },
  arkanoid: { dpad: ["left", "right"], buttons: [] },
  snake: { dpad: ["left", "right", "up", "down"], buttons: [] },
};
