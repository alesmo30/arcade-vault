"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ENGINES } from "./registry";
import { DEFAULT_SKIN, type SkinId } from "./skins";
import type { ControlAction, EngineState, GameEngine } from "./types";

export const GameCanvas = forwardRef<
  GameEngine,
  { gameId: string; skin: SkinId; onState: (state: EngineState) => void }
>(function GameCanvas({ gameId, skin, onState }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  const skinRef = useRef(skin);
  skinRef.current = skin;

  useImperativeHandle(ref, () => ({
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    restart: () => engineRef.current?.restart(),
    endNow: () => engineRef.current?.endNow(),
    destroy: () => engineRef.current?.destroy(),
    setSkin: (nextSkin: SkinId) => engineRef.current?.setSkin?.(nextSkin),
    setControl: (action: ControlAction, pressed: boolean) =>
      engineRef.current?.setControl?.(action, pressed),
  }));

  // Crea/destruye el motor. Nunca depende de `skin`: cambiar de skin no debe remontar el canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    const factory = ENGINES[gameId];
    if (!canvas || !factory) return;

    const engine = factory(
      canvas,
      (state) => onStateRef.current(state),
      skinRef.current ?? DEFAULT_SKIN,
    );
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [gameId]);

  // Repinta con la paleta activa sin tocar el estado de la partida.
  useEffect(() => {
    engineRef.current?.setSkin?.(skin);
  }, [skin]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
});
