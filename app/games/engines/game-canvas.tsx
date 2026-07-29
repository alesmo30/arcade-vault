"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ENGINES } from "./registry";
import type { EngineState, GameEngine } from "./types";

export const GameCanvas = forwardRef<
  GameEngine,
  { gameId: string; onState: (state: EngineState) => void }
>(function GameCanvas({ gameId, onState }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const onStateRef = useRef(onState);
  onStateRef.current = onState;

  useImperativeHandle(ref, () => ({
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    restart: () => engineRef.current?.restart(),
    endNow: () => engineRef.current?.endNow(),
    destroy: () => engineRef.current?.destroy(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const factory = ENGINES[gameId];
    if (!canvas || !factory) return;

    const engine = factory(canvas, (state) => onStateRef.current(state));
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [gameId]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
});
