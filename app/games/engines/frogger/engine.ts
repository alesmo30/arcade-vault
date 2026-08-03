import type { ControlAction, EngineState, GameEngine, GameEngineFactory } from "../types";
import { DEFAULT_SKIN, normalizeSkin, type SkinId } from "../skins";

const CELL = 40;
const COLS = 20;
const ROWS = 15;
const W = COLS * CELL; // 800
const H = ROWS * CELL; // 600

// Zonas (fila 0 = arriba)
const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6; // 6 carriles de río, filas 1-6
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 13; // 6 carriles de carretera, filas 8-13
const ROW_START = 14;

const GOAL_COUNT = 5;
const GOAL_SEGMENT = COLS / GOAL_COUNT; // 4
const GOAL_WIDTH = 2;

const LIVES_START = 3;
const JUMP_MS = 120;
const ROUND_TIME_START = 15;
const ROUND_TIME_MIN = 6;
const ROUND_TIME_STEP = 0.6;
const TURTLE_VISIBLE_S = 3;
const TURTLE_SUBMERGED_S = 1.5;
const LEVEL_SPEED_GROWTH = 1.15;

type Dir = { dc: number; dr: number };
const UP: Dir = { dc: 0, dr: -1 };
const DOWN: Dir = { dc: 0, dr: 1 };
const LEFT: Dir = { dc: -1, dr: 0 };
const RIGHT: Dir = { dc: 1, dr: 0 };

type EntityKind = "car" | "truck" | "log" | "turtle";

type Entity = {
  col: number;
  width: number;
  kind: EntityKind;
  turtlePhase?: number; // segundos acumulados del ciclo de inmersión
};

type Lane = {
  row: number;
  speed: number; // celdas/seg
  dir: 1 | -1;
  isRiver: boolean;
  entities: Entity[];
};

type Frog = {
  col: number;
  row: number;
  animating: boolean;
  animMs: number;
  fromCol: number;
  fromRow: number;
  targetCol: number;
  targetRow: number;
};

type InternalStatus = "playing" | "gameover";

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

function isSubmerged(e: Entity): boolean {
  if (e.kind !== "turtle") return false;
  const cycle = TURTLE_VISIBLE_S + TURTLE_SUBMERGED_S;
  const phase = (e.turtlePhase ?? 0) % cycle;
  return phase >= TURTLE_VISIBLE_S;
}

function goalIndexForCol(col: number): number | null {
  const segment = Math.floor(col / GOAL_SEGMENT);
  if (segment < 0 || segment >= GOAL_COUNT) return null;
  const start = segment * GOAL_SEGMENT + Math.floor((GOAL_SEGMENT - GOAL_WIDTH) / 2);
  if (col >= start && col < start + GOAL_WIDTH) return segment;
  return null;
}

const CAPTURED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

type Palette = {
  roadBg: string;
  riverBg: string;
  safeBg: string;
  car: string;
  truck: string;
  log: string;
  turtle: string;
  frog: string;
  frogEye: string;
  goalEmpty: string;
  goalFilled: string;
  goalBorder: string;
  goalFrog: string;
  hudText: string;
  timeHigh: string;
  timeMid: string;
  timeLow: string;
  overlayTitle: string;
  overlaySub: string;
  glow: boolean;
};

// clasico: valores originales del motor, copiados literales — línea base de regresión.
const CLASICO: Palette = {
  roadBg: "#0a0a0a",
  riverBg: "#04202f",
  safeBg: "#0a2410",
  car: "#ff3b3b",
  truck: "#9aa0a6",
  log: "#7a4a24",
  turtle: "#2ecc71",
  frog: "#00ff66",
  frogEye: "#ffffff",
  goalEmpty: "#08160c",
  goalFilled: "#1a4d2a",
  goalBorder: "#d4af37",
  goalFrog: "#00ff88",
  hudText: "#ffffff",
  timeHigh: "#00ff66",
  timeMid: "#ffff00",
  timeLow: "#ff3b3b",
  overlayTitle: "#00ff66",
  overlaySub: "rgba(255,255,255,0.85)",
  glow: false,
};

// neon: alto contraste sobre negro puro, glow vía shadowBlur, saturación de la paleta CRT (globals.css).
const NEON: Palette = {
  roadBg: "#000000",
  riverBg: "#000814",
  safeBg: "#001a0a",
  car: "#ff006e",
  truck: "#00f5ff",
  log: "#f5ff00",
  turtle: "#00ff88",
  frog: "#00f5ff",
  frogEye: "#f5ff00",
  goalEmpty: "#050505",
  goalFilled: "#003322",
  goalBorder: "#f5ff00",
  goalFrog: "#00f5ff",
  hudText: "#f5ff00",
  timeHigh: "#00ff88",
  timeMid: "#f5ff00",
  timeLow: "#ff006e",
  overlayTitle: "#00f5ff",
  overlaySub: "rgba(245, 255, 0, 0.75)",
  glow: true,
};

// retro: fósforo verde limitado, sin glow, bordes duros.
const RETRO: Palette = {
  roadBg: "#001100",
  riverBg: "#001a15",
  safeBg: "#002200",
  car: "#33ff66",
  truck: "#1f9b46",
  log: "#0d5c26",
  turtle: "#1f9b46",
  frog: "#aaffcc",
  frogEye: "#001100",
  goalEmpty: "#001a08",
  goalFilled: "#0d5c26",
  goalBorder: "#33ff66",
  goalFrog: "#aaffcc",
  hudText: "#aaffcc",
  timeHigh: "#33ff66",
  timeMid: "#aaffcc",
  timeLow: "#1f9b46",
  overlayTitle: "#aaffcc",
  overlaySub: "#1f9b46",
  glow: false,
};

const PALETTES: Record<SkinId, Palette> = {
  clasico: CLASICO,
  neon: NEON,
  retro: RETRO,
};

export const createFroggerEngine: GameEngineFactory = (canvas, onState, initialSkin) => {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("2D context not available");
  const ctx = ctxOrNull;

  let skin: SkinId = normalizeSkin(initialSkin ?? DEFAULT_SKIN);
  let palette: Palette = PALETTES[skin];

  let lanes: Lane[];
  let frog: Frog;
  let goalsOccupied: boolean[];
  let visitedCols: Set<number>;
  let score: number;
  let lives: number;
  let level: number;
  let roundTime: number;
  let roundTimeMax: number;
  let pendingDir: Dir | null;
  let state: InternalStatus;

  let externalPaused = false;
  let rafId: number | null = null;
  let lastTime: number | null = null;

  function dirForKey(code: string): Dir | null {
    if (code === "ArrowUp") return UP;
    if (code === "ArrowDown") return DOWN;
    if (code === "ArrowLeft") return LEFT;
    if (code === "ArrowRight") return RIGHT;
    return null;
  }

  function applyKeyDown(code: string) {
    const dir = dirForKey(code);
    if (!dir) return;
    pendingDir = dir;
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    applyKeyDown(e.code);
  };

  window.addEventListener("keydown", onKeyDown);

  const ACTION_TO_CODE: Partial<Record<ControlAction, string>> = {
    left: "ArrowLeft",
    right: "ArrowRight",
    up: "ArrowUp",
    down: "ArrowDown",
  };

  function laneSpeedRange(isRiver: boolean): [number, number] {
    return isRiver ? [1.2, 3.2] : [1.8, 4.5];
  }

  function buildLane(row: number, isRiver: boolean, lvl: number): Lane {
    const [minS, maxS] = laneSpeedRange(isRiver);
    const growth = Math.pow(LEVEL_SPEED_GROWTH, lvl - 1);
    const speed = rand(minS, maxS) * growth;
    const dir: 1 | -1 = row % 2 === 0 ? 1 : -1;
    const entities: Entity[] = [];

    if (isRiver) {
      let col = randInt(-2, 1);
      while (col < COLS + 2) {
        const isLog = Math.random() < 0.55;
        const width = isLog ? randInt(2, 4) : randInt(2, 3);
        const kind: EntityKind = isLog ? "log" : "turtle";
        entities.push({
          col,
          width,
          kind,
          turtlePhase: rand(0, TURTLE_VISIBLE_S + TURTLE_SUBMERGED_S),
        });
        col += width + randInt(2, 4);
      }
    } else {
      let col = randInt(-2, 1);
      while (col < COLS + 2) {
        const isTruck = Math.random() < 0.35;
        const width = isTruck ? randInt(2, 3) : 1;
        entities.push({ col, width, kind: isTruck ? "truck" : "car" });
        col += width + randInt(2, 5);
      }
    }

    return { row, speed, dir, isRiver, entities };
  }

  function buildLanes(lvl: number): Lane[] {
    const next: Lane[] = [];
    for (let row = ROW_RIVER_TOP; row <= ROW_RIVER_BOT; row++) next.push(buildLane(row, true, lvl));
    for (let row = ROW_ROAD_TOP; row <= ROW_ROAD_BOT; row++) next.push(buildLane(row, false, lvl));
    return next;
  }

  function laneAtRow(row: number): Lane | undefined {
    return lanes.find((l) => l.row === row);
  }

  function resetFrog() {
    frog = {
      col: Math.floor(COLS / 2),
      row: ROW_START,
      animating: false,
      animMs: 0,
      fromCol: Math.floor(COLS / 2),
      fromRow: ROW_START,
      targetCol: Math.floor(COLS / 2),
      targetRow: ROW_START,
    };
    pendingDir = null;
  }

  function resetRoundTimer() {
    roundTimeMax = Math.max(ROUND_TIME_MIN, ROUND_TIME_START - (level - 1) * ROUND_TIME_STEP);
    roundTime = roundTimeMax;
  }

  function initGame() {
    level = 1;
    score = 0;
    lives = LIVES_START;
    lanes = buildLanes(level);
    goalsOccupied = new Array(GOAL_COUNT).fill(false);
    visitedCols = new Set();
    resetFrog();
    resetRoundTimer();
    state = "playing";
  }

  function getSupport(): Entity | null {
    const lane = laneAtRow(frog.row);
    if (!lane || !lane.isRiver) return null;
    for (const e of lane.entities) {
      if (frog.col >= e.col && frog.col < e.col + e.width) {
        if (isSubmerged(e)) return null;
        return e;
      }
    }
    return null;
  }

  function checkRoadCollision(): boolean {
    const lane = laneAtRow(frog.row);
    if (!lane || lane.isRiver) return false;
    return lane.entities.some((e) => frog.col >= e.col && frog.col < e.col + e.width);
  }

  function killFrog() {
    lives--;
    if (lives <= 0) {
      lives = 0;
      onStateChange();
      state = "gameover";
      return;
    }
    resetFrog();
    resetRoundTimer();
  }

  function completeRound() {
    score += 200;
    level++;
    lanes = buildLanes(level);
    goalsOccupied = new Array(GOAL_COUNT).fill(false);
    visitedCols = new Set();
    resetFrog();
    resetRoundTimer();
  }

  function resolveArrival() {
    if (frog.row === ROW_GOALS) {
      const idx = goalIndexForCol(frog.col);
      if (idx === null || goalsOccupied[idx]) {
        killFrog();
        return;
      }
      goalsOccupied[idx] = true;
      score += 50 + Math.round(roundTime * 10);
      if (goalsOccupied.every(Boolean)) {
        completeRound();
      } else {
        resetFrog();
      }
      return;
    }

    const lane = laneAtRow(frog.row);
    if (lane && lane.isRiver) {
      if (frog.col < 0 || frog.col >= COLS || !getSupport()) {
        killFrog();
        return;
      }
    } else if (checkRoadCollision()) {
      killFrog();
      return;
    }

    if (!visitedCols.has(frog.row) && frog.row < ROW_START) {
      visitedCols.add(frog.row);
      score += 10;
    }
  }

  function startJump(dir: Dir) {
    const targetCol = frog.col + dir.dc;
    const targetRow = frog.row + dir.dr;
    if (targetCol < 0 || targetCol >= COLS) return;
    if (targetRow > ROW_START || targetRow < ROW_GOALS) return;
    frog.animating = true;
    frog.animMs = 0;
    frog.fromCol = frog.col;
    frog.fromRow = frog.row;
    frog.targetCol = targetCol;
    frog.targetRow = targetRow;
  }

  function updateEntities(dtMs: number) {
    for (const lane of lanes) {
      const move = (lane.speed * lane.dir * dtMs) / 1000;
      for (const e of lane.entities) {
        e.col += move;
        if (lane.dir === 1 && e.col > COLS + 2) e.col = -e.width - randInt(0, 3);
        if (lane.dir === -1 && e.col < -e.width - 2) e.col = COLS + randInt(0, 3);
        if (e.kind === "turtle") {
          e.turtlePhase = (e.turtlePhase ?? 0) + dtMs / 1000;
        }
      }
    }
  }

  function update(dt: number) {
    if (state !== "playing") return;
    const dtMs = dt * 1000;
    updateEntities(dtMs);

    if (frog.animating) {
      frog.animMs += dtMs;
      if (frog.animMs >= JUMP_MS) {
        frog.animating = false;
        frog.col = frog.targetCol;
        frog.row = frog.targetRow;
        resolveArrival();
      }
    } else {
      if (pendingDir) {
        startJump(pendingDir);
        pendingDir = null;
      } else {
        const support = getSupport();
        if (support) {
          const lane = laneAtRow(frog.row)!;
          frog.col += (lane.speed * lane.dir * dtMs) / 1000;
          if (frog.col < 0 || frog.col >= COLS) {
            killFrog();
          }
        }
      }
    }

    if (state === "playing") {
      roundTime -= dt;
      if (roundTime <= 0) {
        roundTime = 0;
        killFrog();
      }
    }
  }

  function frogDrawPos(): { x: number; y: number } {
    if (!frog.animating) return { x: frog.col * CELL, y: frog.row * CELL };
    const t = Math.min(1, frog.animMs / JUMP_MS);
    const x = frog.fromCol + (frog.targetCol - frog.fromCol) * t;
    const y = frog.fromRow + (frog.targetRow - frog.fromRow) * t;
    const hop = Math.sin(t * Math.PI) * 6;
    return { x: x * CELL, y: y * CELL - hop };
  }

  function zoneColorForRow(row: number): string {
    if (row === ROW_GOALS) return palette.safeBg;
    if (row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT) return palette.riverBg;
    if (row === ROW_SAFE_MID || row === ROW_START) return palette.safeBg;
    return palette.roadBg;
  }

  function draw() {
    ctx.shadowBlur = 0;
    for (let row = 0; row < ROWS; row++) {
      ctx.fillStyle = zoneColorForRow(row);
      ctx.fillRect(0, row * CELL, W, CELL);
    }

    // bocas destino
    for (let i = 0; i < GOAL_COUNT; i++) {
      const start = i * GOAL_SEGMENT + Math.floor((GOAL_SEGMENT - GOAL_WIDTH) / 2);
      const x = start * CELL;
      ctx.fillStyle = goalsOccupied[i] ? palette.goalFilled : palette.goalEmpty;
      ctx.fillRect(x, ROW_GOALS * CELL, GOAL_WIDTH * CELL, CELL);
      ctx.strokeStyle = palette.goalBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, ROW_GOALS * CELL + 1, GOAL_WIDTH * CELL - 2, CELL - 2);
      if (goalsOccupied[i]) {
        ctx.fillStyle = palette.goalFrog;
        ctx.beginPath();
        ctx.ellipse(
          x + (GOAL_WIDTH * CELL) / 2,
          ROW_GOALS * CELL + CELL / 2,
          12,
          10,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    for (const lane of lanes) {
      for (const e of lane.entities) {
        const x = e.col * CELL;
        const y = lane.row * CELL;
        const w = e.width * CELL;
        if (e.kind === "car") {
          if (palette.glow) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = palette.car;
          }
          ctx.fillStyle = palette.car;
          ctx.fillRect(x + 4, y + 8, w - 8, CELL - 16);
          ctx.shadowBlur = 0;
        } else if (e.kind === "truck") {
          if (palette.glow) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = palette.truck;
          }
          ctx.fillStyle = palette.truck;
          ctx.fillRect(x + 4, y + 6, w - 8, CELL - 12);
          ctx.shadowBlur = 0;
        } else if (e.kind === "log") {
          ctx.fillStyle = palette.log;
          ctx.fillRect(x + 2, y + 10, w - 4, CELL - 20);
        } else {
          const submerged = isSubmerged(e);
          ctx.globalAlpha = submerged ? 0.3 : 1;
          if (palette.glow) {
            ctx.shadowBlur = 6;
            ctx.shadowColor = palette.turtle;
          }
          ctx.fillStyle = palette.turtle;
          for (let i = 0; i < e.width; i++) {
            ctx.beginPath();
            ctx.arc(x + i * CELL + CELL / 2, y + CELL / 2, CELL / 2 - 6, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
    }

    const { x: fx, y: fy } = frogDrawPos();
    if (palette.glow) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = palette.frog;
    }
    ctx.fillStyle = palette.frog;
    ctx.beginPath();
    ctx.ellipse(fx + CELL / 2, fy + CELL / 2, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = palette.frogEye;
    ctx.beginPath();
    ctx.arc(fx + CELL / 2 - 5, fy + CELL / 2 - 6, 3, 0, Math.PI * 2);
    ctx.arc(fx + CELL / 2 + 5, fy + CELL / 2 - 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // HUD interno
    ctx.textAlign = "left";
    ctx.fillStyle = palette.hudText;
    ctx.font = "16px monospace";
    ctx.fillText(`SCORE ${score}`, 8, 16);
    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${level}`, W / 2, 16);
    ctx.textAlign = "right";
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = palette.frog;
      ctx.beginPath();
      ctx.arc(W - 12 - i * 18, 12, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    const timeRatio = roundTimeMax > 0 ? roundTime / roundTimeMax : 0;
    ctx.fillStyle =
      timeRatio > 0.5 ? palette.timeHigh : timeRatio > 0.2 ? palette.timeMid : palette.timeLow;
    ctx.fillRect(0, 0, W * Math.max(0, timeRatio), 4);

    if (state === "gameover") {
      ctx.textAlign = "center";
      ctx.fillStyle = palette.overlayTitle;
      ctx.font = "bold 46px monospace";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 18);
      ctx.font = "18px monospace";
      ctx.fillStyle = palette.overlaySub;
      ctx.fillText(`PUNTAJE: ${score}`, W / 2, H / 2 + 22);
    }
  }

  let lastEmitted: EngineState | null = null;
  function onStateChange() {
    maybeEmit();
  }
  function maybeEmit() {
    const next: EngineState = {
      score,
      lives,
      level,
      status: externalPaused ? "paused" : state,
    };
    if (
      !lastEmitted ||
      lastEmitted.score !== next.score ||
      lastEmitted.lives !== next.lives ||
      lastEmitted.level !== next.level ||
      lastEmitted.status !== next.status
    ) {
      lastEmitted = next;
      onState(next);
    }
  }

  function loop(ts: number) {
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    draw();
    maybeEmit();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    lastTime = null;
    rafId = requestAnimationFrame(loop);
  }

  initGame();
  maybeEmit();
  startLoop();

  const engine: GameEngine = {
    pause() {
      if (externalPaused) return;
      externalPaused = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      maybeEmit();
    },
    resume() {
      if (!externalPaused) return;
      externalPaused = false;
      maybeEmit();
      startLoop();
    },
    restart() {
      initGame();
      if (externalPaused) {
        externalPaused = false;
      }
      maybeEmit();
      if (rafId === null) startLoop();
    },
    endNow() {
      state = "gameover";
      lives = 0;
      if (externalPaused) {
        externalPaused = false;
        if (rafId === null) startLoop();
      } else {
        maybeEmit();
      }
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
    setSkin(nextSkin) {
      skin = normalizeSkin(nextSkin);
      palette = PALETTES[skin];
      draw();
    },
    setControl(action, pressed) {
      if (!pressed) return;
      const code = ACTION_TO_CODE[action];
      if (!code) return;
      applyKeyDown(code);
    },
  };

  return engine;
};
