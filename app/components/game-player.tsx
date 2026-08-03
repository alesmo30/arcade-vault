"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSession } from "@/app/auth-context";
import type { Game } from "@/app/data";
import { saveScore } from "@/app/games/actions";
import { ENGINES } from "@/app/games/engines/registry";
import { GameCanvas } from "@/app/games/engines/game-canvas";
import { CONTROLS } from "@/app/games/engines/controls";
import { DEFAULT_SKIN, SKINS, normalizeSkin, type SkinId } from "@/app/games/engines/skins";
import type { ControlAction, EngineState, GameEngine } from "@/app/games/engines/types";
import { TouchPad } from "@/app/components/touch-pad";
import { useCoarsePointer } from "@/app/components/use-coarse-pointer";

const SKIN_STORAGE_KEY = "av_skin";
const skinListeners = new Set<() => void>();
let cachedSkin: SkinId = DEFAULT_SKIN;
let skinHydrated = false;

function readStoredSkin(): SkinId {
  try {
    return normalizeSkin(localStorage.getItem(SKIN_STORAGE_KEY));
  } catch {
    return DEFAULT_SKIN;
  }
}

function getSkinSnapshot(): SkinId {
  if (!skinHydrated) {
    cachedSkin = readStoredSkin();
    skinHydrated = true;
  }
  return cachedSkin;
}

function getSkinServerSnapshot(): SkinId {
  return DEFAULT_SKIN;
}

function subscribeSkin(callback: () => void) {
  skinListeners.add(callback);
  return () => skinListeners.delete(callback);
}

function setStoredSkin(next: SkinId) {
  cachedSkin = next;
  skinHydrated = true;
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, next);
  } catch {
    // localStorage puede fallar (modo privado, cuotas); la skin sigue funcionando en memoria.
  }
  skinListeners.forEach((listener) => listener());
}

const FIXED_SCORE = 28450;
const FIXED_LIVES = 3;
const FIXED_LEVEL = "01";

export function GamePlayer({ game }: { game: Game }) {
  const { user } = useSession();
  const hasEngine = !!ENGINES[game.id];
  const isTouch = useCoarsePointer();
  const padLayout = CONTROLS[game.id];
  const showPad = hasEngine && isTouch && !!padLayout;

  useEffect(() => {
    document.body.classList.toggle("is-touch-game", isTouch);
    return () => document.body.classList.remove("is-touch-game");
  }, [isTouch]);

  const engineRef = useRef<GameEngine>(null);
  const [engineState, setEngineState] = useState<EngineState | null>(null);

  const [mockPaused, setMockPaused] = useState(false);
  const [mockOver, setMockOver] = useState(false);

  const [name, setName] = useState(user ? user.name : "INVITADO");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Igual que useSession en auth-context: server siempre ve DEFAULT_SKIN, el cliente hidrata desde localStorage.
  const skin = useSyncExternalStore(subscribeSkin, getSkinSnapshot, getSkinServerSnapshot);
  const selectSkin = (next: SkinId) => setStoredSkin(next);

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

  const handleControl = (action: ControlAction, pressed: boolean) => {
    engineRef.current?.setControl?.(action, pressed);
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
    setSaveState("idle");
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!hasEngine) {
      setSaveState("saved");
      return;
    }

    setSaveState("saving");
    setSaveError(null);
    const result = await saveScore({ gameId: game.id, playerName: name, score });
    if (result.ok) {
      setSaveState("saved");
    } else {
      setSaveState("error");
      setSaveError(result.error ?? "NO SE PUDO GUARDAR");
    }
  };

  return (
    <div className={`av-player fade-in${isTouch ? " is-touch" : ""}`}>
      <div className="player-hud">
        <div className="hud-stats" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
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
          {hasEngine && (
            <div className="skin-select hud-skin" role="group" aria-label="Elegir skin">
              <span className="skin-select-label">SKIN</span>
              <div className="skin-select-options">
                {SKINS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`skin-btn skin-${s.id}${skin === s.id ? " active" : ""}`}
                    aria-pressed={skin === s.id}
                    onClick={() => selectSkin(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="hud-buttons">
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
      </div>

      <div className="crt">
        <div className="crt-screen">
          {hasEngine ? (
            <GameCanvas ref={engineRef} gameId={game.id} skin={skin} onState={setEngineState} />
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

      {showPad && <TouchPad layout={padLayout} onControl={handleControl} />}

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {saveState === "saved" ? (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            ) : (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                  disabled={!!user}
                />
                <button
                  className="btn yellow"
                  onClick={handleSave}
                  disabled={saveState === "saving"}
                >
                  {saveState === "saving" ? "GUARDANDO…" : "GUARDAR PUNTUACIÓN"}
                </button>
                {hasEngine && saveState === "error" && (
                  <span className="mono" style={{ fontSize: 11, color: "var(--magenta)" }}>
                    {saveError}
                  </span>
                )}
              </div>
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
