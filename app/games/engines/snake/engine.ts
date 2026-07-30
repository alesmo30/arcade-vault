import type { EngineState, GameEngine, GameEngineFactory } from "../types";

const W = 800;
const H = 600;
const CELL = 25;
const COLS = W / CELL;
const ROWS = H / CELL;

const MAX_LEVEL = 10;
const FRUITS_PER_LEVEL = 5;
const TICK_START = 0.16;
const TICK_MIN = 0.055;
const DIR_QUEUE_MAX = 2;

type Dir = { x: number; y: number };
const UP: Dir = { x: 0, y: -1 };
const DOWN: Dir = { x: 0, y: 1 };
const LEFT: Dir = { x: -1, y: 0 };
const RIGHT: Dir = { x: 1, y: 0 };

const opposite = (a: Dir, b: Dir) => a.x === -b.x && a.y === -b.y;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

const CAPTURED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

const COLORS = {
  bg: "#050f0a",
  grid: "rgba(0, 255, 136, 0.05)",
  body: "#00ff88",
  bodyStroke: "#00c46a",
  head: "#d4ffe9",
  fallbackFruit: "#ff006e",
  hudAccent: "#ff006e",
  overlayTitle: "#00ff88",
  overlaySub: "rgba(212, 255, 233, 0.85)",
};

// ── Atlas de frutas (portado de references/templates/snake-assets/sprites.js) ──
type SpriteRect = { x: number; y: number; w: number; h: number };
const FRUIT_ATLAS: Record<string, SpriteRect> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};

type Tier = "common" | "rare" | "legendary";
const TIER_NAMES: Record<Tier, string[]> = {
  common: [
    "banana",
    "orange",
    "grape",
    "strawberry",
    "cherry",
    "apple",
    "tomato",
    "berries",
    "lemon",
    "peach",
    "grapes2",
  ],
  rare: ["watermelon", "pepper", "kiwi", "pineapple", "melon", "carrot"],
  legendary: ["garlic", "eggplant", "mushroom", "broccoli", "peanut"],
};
const TIER_POINTS: Record<Tier, number> = { common: 10, rare: 25, legendary: 50 };
const TIER_GROWTH: Record<Tier, number> = { common: 1, rare: 2, legendary: 3 };
const TIER_WEIGHTS: [Tier, number][] = [
  ["common", 0.7],
  ["rare", 0.25],
  ["legendary", 0.05],
];

function pickTier(): Tier {
  const r = Math.random();
  let acc = 0;
  for (const [tier, weight] of TIER_WEIGHTS) {
    acc += weight;
    if (r <= acc) return tier;
  }
  return "common";
}

type Cell = { x: number; y: number };
type Fruit = { pos: Cell; tier: Tier; name: string };

type InternalStatus = "playing" | "gameover";

export const createSnakeEngine: GameEngineFactory = (canvas, onState) => {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("2D context not available");
  const ctx = ctxOrNull;

  const keys: Record<string, boolean> = {};

  const dirForKey = (code: string): Dir | null => {
    if (code === "ArrowUp") return UP;
    if (code === "ArrowDown") return DOWN;
    if (code === "ArrowLeft") return LEFT;
    if (code === "ArrowRight") return RIGHT;
    return null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    if (keys[e.code]) return;
    keys[e.code] = true;
    const dir = dirForKey(e.code);
    if (!dir) return;
    const last = dirQueue.length > 0 ? dirQueue[dirQueue.length - 1] : direction;
    if (opposite(dir, last)) return;
    if (dir.x === last.x && dir.y === last.y) return;
    if (dirQueue.length >= DIR_QUEUE_MAX) return;
    dirQueue.push(dir);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    keys[e.code] = false;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // ── Sprite de frutas ──────────────────────────────────────────────────
  const fruitImage = new Image();
  let imageReady = false;
  fruitImage.onload = () => {
    imageReady = true;
  };
  fruitImage.src = "/games/snake/fruits.png";

  // ── Estado mutable ──────────────────────────────────────────────────────
  let body: Cell[];
  let direction: Dir;
  let dirQueue: Dir[];
  let pendingGrowth: number;
  let fruit: Fruit;
  let score: number;
  let level: number;
  let fruitsEaten: number;
  let tickAcc: number;
  let state: InternalStatus;

  let externalPaused = false;
  let rafId: number | null = null;
  let lastTime: number | null = null;

  function tickInterval() {
    const t = (level - 1) / (MAX_LEVEL - 1);
    return TICK_START - t * (TICK_START - TICK_MIN);
  }

  function freeCells(): Cell[] {
    const occupied = new Set(body.map((s) => `${s.x},${s.y}`));
    const free: Cell[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!occupied.has(`${x},${y}`)) free.push({ x, y });
      }
    }
    return free;
  }

  function spawnFruit() {
    const free = freeCells();
    if (free.length === 0) {
      state = "gameover";
      return;
    }
    const pos = free[randInt(0, free.length - 1)];
    const tier = pickTier();
    const names = TIER_NAMES[tier];
    const name = names[randInt(0, names.length - 1)];
    fruit = { pos, tier, name };
  }

  function initGame() {
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    body = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy },
    ];
    direction = RIGHT;
    dirQueue = [];
    pendingGrowth = 0;
    score = 0;
    level = 1;
    fruitsEaten = 0;
    tickAcc = 0;
    state = "playing";
    spawnFruit();
  }

  function tick() {
    if (dirQueue.length > 0) {
      direction = dirQueue.shift()!;
    }

    const head = body[0];
    const newHead: Cell = { x: head.x + direction.x, y: head.y + direction.y };

    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      state = "gameover";
      return;
    }

    const growing = pendingGrowth > 0;
    const checkBody = growing ? body : body.slice(0, -1);
    if (checkBody.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      state = "gameover";
      return;
    }

    body.unshift(newHead);
    if (growing) {
      pendingGrowth--;
    } else {
      body.pop();
    }

    if (newHead.x === fruit.pos.x && newHead.y === fruit.pos.y) {
      score += TIER_POINTS[fruit.tier];
      pendingGrowth += TIER_GROWTH[fruit.tier];
      fruitsEaten++;
      if (fruitsEaten % FRUITS_PER_LEVEL === 0 && level < MAX_LEVEL) level++;
      spawnFruit();
    }
  }

  function update(dt: number) {
    if (state === "gameover") return;
    tickAcc += dt;
    const interval = tickInterval();
    while (tickAcc >= interval && state === "playing") {
      tickAcc -= interval;
      tick();
    }
  }

  function drawGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(W, y * CELL);
      ctx.stroke();
    }
  }

  function drawFruit() {
    const px = fruit.pos.x * CELL;
    const py = fruit.pos.y * CELL;
    if (imageReady) {
      const rect = FRUIT_ATLAS[fruit.name];
      ctx.drawImage(fruitImage, rect.x, rect.y, rect.w, rect.h, px + 2, py + 2, CELL - 4, CELL - 4);
    } else {
      ctx.fillStyle = COLORS.fallbackFruit;
      ctx.beginPath();
      ctx.arc(px + CELL / 2, py + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSnake() {
    for (let i = body.length - 1; i >= 0; i--) {
      const s = body[i];
      const px = s.x * CELL;
      const py = s.y * CELL;
      ctx.fillStyle = i === 0 ? COLORS.head : COLORS.body;
      ctx.strokeStyle = COLORS.bodyStroke;
      ctx.lineWidth = 1.5;
      ctx.fillRect(px + 2, py + 2, CELL - 4, CELL - 4);
      ctx.strokeRect(px + 2, py + 2, CELL - 4, CELL - 4);
    }
  }

  function drawOverlay(title: string, sub: string) {
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.overlayTitle;
    ctx.font = "bold 46px monospace";
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.font = "18px monospace";
    ctx.fillStyle = COLORS.overlaySub;
    ctx.fillText(sub, W / 2, H / 2 + 22);
  }

  function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);
    drawGrid();
    drawFruit();
    drawSnake();

    if (state === "gameover") drawOverlay("GAME OVER", `PUNTAJE: ${score}`);
  }

  let lastEmitted: EngineState | null = null;
  function maybeEmit() {
    const next: EngineState = {
      score,
      lives: state === "gameover" ? 0 : 1,
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
      if (externalPaused) {
        externalPaused = false;
        if (rafId === null) startLoop();
      } else {
        maybeEmit();
      }
    },
    destroy() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      fruitImage.onload = null;
    },
  };

  return engine;
};
