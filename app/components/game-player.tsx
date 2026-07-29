"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "@/app/auth-context";
import type { Game } from "@/app/data";
import { ENGINES } from "@/app/games/engines/registry";
import { GameCanvas } from "@/app/games/engines/game-canvas";
import type { EngineState, GameEngine } from "@/app/games/engines/types";

const FIXED_SCORE = 28450;
const FIXED_LIVES = 3;
const FIXED_LEVEL = "01";

export function GamePlayer({ game }: { game: Game }) {
  const { user } = useSession();
  const hasEngine = !!ENGINES[game.id];

  const engineRef = useRef<GameEngine>(null);
  const [engineState, setEngineState] = useState<EngineState | null>(null);

  const [mockPaused, setMockPaused] = useState(false);
  const [mockOver, setMockOver] = useState(false);

  const [name, setName] = useState(user ? user.name : "INVITADO");
  const [saved, setSaved] = useState(false);

  const score = hasEngine ? (engineState?.score ?? 0) : FIXED_SCORE;
  const lives = hasEngine ? (engineState?.lives ?? 0) : FIXED_LIVES;
  const level = hasEngine ? String(engineState?.level ?? 1).padStart(2, "0") : FIXED_LEVEL;
  const paused = hasEngine ? engineState?.status === "paused" : mockPaused;
  const over = hasEngine ? engineState?.status === "gameover" : mockOver;

  const togglePause = () => {
    if (hasEngine) {
      if (paused) engineRef.current?.resume();
      else engineRef.current?.pause();
    } else {
      setMockPaused((p) => !p);
    }
  };

  const endGame = () => {
    if (hasEngine) engineRef.current?.endNow();
    else setMockOver(true);
  };

  const restart = () => {
    if (hasEngine) {
      engineRef.current?.restart();
    } else {
      setMockPaused(false);
      setMockOver(false);
    }
    setSaved(false);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{level}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={togglePause}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <Link href={`/games/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {hasEngine ? (
            <GameCanvas ref={engineRef} gameId={game.id} onState={setEngineState} />
          ) : (
            <div className="game-arena">
              <div className="grid-floor"></div>
              <div className="enemy e1"></div>
              <div className="enemy e2"></div>
              <div className="enemy e3"></div>
              <div className="player-ship"></div>
            </div>
          )}
          {paused && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                />
                <button className="btn yellow" onClick={() => setSaved(true)}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
