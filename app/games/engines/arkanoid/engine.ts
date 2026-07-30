import type { EngineState, GameEngine, GameEngineFactory } from "../types";

const W = 800;
const H = 600;

const PADDLE_W = 81;
const PADDLE_H = 14;
const PADDLE_Y = 560;
const PADDLE_SPEED = 400;

const BALL_SIZE = 16;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;
const MAX_BOUNCE_ANGLE = (5 * Math.PI) / 12; // 75° desde la vertical, evita rebotes casi horizontales

const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;
const POINTS_PER_BLOCK = 10;

const EXPLOSION_DURATION = 0.32;
const PARTICLES_PER_BLOCK = 8;

const CAPTURED_KEYS = new Set(["ArrowLeft", "ArrowRight"]);

type BlockColor = "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";

const ROW_COLORS_1: BlockColor[] = ["red", "yellow", "cyan", "magenta", "hotpink", "green"];
const ROW_COLORS_2: BlockColor[] = ["magenta", "cyan", "hotpink", "yellow", "green", "red"];
const ROW_COLORS_4: BlockColor[] = ["cyan", "magenta", "green", "yellow", "hotpink", "red"];

const COLORS: Record<BlockColor, string> & {
  paddle: string;
  ball: string;
  hudText: string;
  overlayTitle: string;
  overlaySub: string;
} = {
  red: "#ff3b3b",
  yellow: "#f5ff00",
  cyan: "#00f5ff",
  magenta: "#ff006e",
  hotpink: "#ff4fd8",
  green: "#00ff88",
  paddle: "#e6e9ff",
  ball: "#ff006e",
  hudText: "#e6e9ff",
  overlayTitle: "#ff006e",
  overlaySub: "rgba(138, 143, 181, 0.85)",
};

type Level = { speed: number; blocks: { col: number; row: number; color: BlockColor }[] };

const LEVELS: Level[] = (() => {
  const l1: Level["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++) l1.push({ col, row, color: ROW_COLORS_1[row] });

  const l2: Level["blocks"] = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: ROW_COLORS_2[row] });

  const l3: Level["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      if ((col + row) % 2 === 0) l3.push({ col, row, color: row < 3 ? "yellow" : "magenta" });

  const gaps4 = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const l4: Level["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      if (!gaps4[row].includes(col)) l4.push({ col, row, color: ROW_COLORS_4[row] });

  const l5: Level["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++) {
      const isFrame = col === 0 || col === BLOCK_COLS - 1 || row === 0 || row === BLOCK_ROWS - 1;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({ col, row, color: isCross && !isFrame ? "hotpink" : "cyan" });
    }

  return [
    { speed: 1.0, blocks: l1 },
    { speed: 1.1, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ];
})();

type InternalStatus = "playing" | "dead" | "gameover";

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const createArkanoidEngine: GameEngineFactory = (canvas, onState) => {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("2D context not available");
  const ctx = ctxOrNull;

  const keys: Record<string, boolean> = {};

  const onKeyDown = (e: KeyboardEvent) => {
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    keys[e.code] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    keys[e.code] = false;
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // ── Block ───────────────────────────────────────────────────────────────
  type Block = { x: number; y: number; w: number; h: number; color: BlockColor; alive: boolean };

  // ── Explosion ───────────────────────────────────────────────────────────
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    ttl: number;
    color: string;
    dead = false;

    constructor(x: number, y: number, color: string) {
      this.x = x;
      this.y = y;
      const angle = rand(0, Math.PI * 2);
      const speed = rand(60, 220);
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = EXPLOSION_DURATION;
      this.ttl = this.life;
      this.color = color;
    }

    update(dt: number) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.ttl -= dt;
      if (this.ttl <= 0) this.dead = true;
    }

    draw() {
      const alpha = Math.max(0, this.ttl / this.life);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
      ctx.globalAlpha = 1;
    }
  }

  // ── Estado del juego ────────────────────────────────────────────────────
  const paddle = { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
  const ball = { x: 0, y: 0, w: BALL_SIZE, h: BALL_SIZE, vx: 0, vy: 0 };

  let blocks: Block[];
  let particles: Particle[];
  let score: number;
  let lives: number;
  let level: number;
  let state: InternalStatus;

  let externalPaused = false;
  let rafId: number | null = null;
  let lastTime: number | null = null;

  function initPaddle() {
    paddle.x = (W - paddle.w) / 2;
  }

  function launchBall() {
    const speed = LEVELS[level - 1].speed;
    ball.x = paddle.x + (paddle.w - ball.w) / 2;
    ball.y = paddle.y - ball.h;
    ball.vx = BASE_BALL_VX * speed;
    ball.vy = BASE_BALL_VY * speed;
  }

  function loadLevel(n: number) {
    level = n;
    const def = LEVELS[n - 1];
    blocks = def.blocks.map((b) => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }));
    particles = [];
    launchBall();
  }

  function initGame() {
    initPaddle();
    score = 0;
    lives = 3;
    state = "playing";
    loadLevel(1);
  }

  function collideAABB(block: Block) {
    return (
      ball.x < block.x + block.w &&
      ball.x + ball.w > block.x &&
      ball.y < block.y + block.h &&
      ball.y + ball.h > block.y
    );
  }

  function explode(block: Block) {
    const color = COLORS[block.color];
    const cx = block.x + block.w / 2;
    const cy = block.y + block.h / 2;
    for (let i = 0; i < PARTICLES_PER_BLOCK; i++) particles.push(new Particle(cx, cy, color));
  }

  function update(dt: number) {
    if (state === "gameover") return;

    if (keys["ArrowLeft"]) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    if (keys["ArrowRight"]) paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x + ball.w >= W) {
      ball.x = W - ball.w;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
    }

    if (
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + 8
    ) {
      const ballCenter = ball.x + ball.w / 2;
      const paddleCenter = paddle.x + paddle.w / 2;
      const offset = Math.max(-1, Math.min(1, (ballCenter - paddleCenter) / (paddle.w / 2)));
      const angle = offset * MAX_BOUNCE_ANGLE;
      const speed = Math.hypot(ball.vx, ball.vy);
      ball.y = paddle.y - ball.h;
      ball.vx = speed * Math.sin(angle);
      ball.vy = -speed * Math.cos(angle);
    }

    for (const block of blocks) {
      if (!block.alive) continue;
      if (collideAABB(block)) {
        block.alive = false;
        explode(block);
        score += POINTS_PER_BLOCK;
        ball.vy = -ball.vy;
        if (blocks.every((b) => !b.alive)) {
          if (level < LEVELS.length) loadLevel(level + 1);
          else state = "gameover";
        }
        break;
      }
    }

    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);

    if (ball.y > H) {
      lives--;
      if (lives <= 0) {
        lives = 0;
        state = "gameover";
      } else {
        launchBall();
      }
    }
  }

  function drawBlock(block: Block) {
    ctx.fillStyle = COLORS[block.color];
    ctx.fillRect(block.x + 1, block.y + 1, block.w - 2, block.h - 2);
  }

  function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    for (const block of blocks) if (block.alive) drawBlock(block);

    particles.forEach((p) => p.draw());

    ctx.fillStyle = COLORS.paddle;
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);

    ctx.fillStyle = COLORS.ball;
    ctx.beginPath();
    ctx.arc(ball.x + ball.w / 2, ball.y + ball.h / 2, ball.w / 2, 0, Math.PI * 2);
    ctx.fill();

    if (state === "gameover") {
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.overlayTitle;
      ctx.font = "bold 46px monospace";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 18);
      ctx.font = "18px monospace";
      ctx.fillStyle = COLORS.overlaySub;
      ctx.fillText(`PUNTAJE: ${score}`, W / 2, H / 2 + 22);
    }
  }

  let lastEmitted: EngineState | null = null;
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
    },
  };

  return engine;
};
