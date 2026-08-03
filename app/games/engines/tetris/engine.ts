import type { ControlAction, EngineState, GameEngine, GameEngineFactory } from "../types";
import { DEFAULT_SKIN, normalizeSkin, type SkinId } from "../skins";

const W = 800;
const H = 600;

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const BOARD_X = Math.floor((W - COLS * BLOCK) / 2);
const BOARD_Y = Math.floor((H - ROWS * BLOCK) / 2);

const PANEL_X = BOARD_X + COLS * BLOCK + 40;

const LINE_SCORES = [0, 100, 300, 500, 800];

type Shape = number[][];

const PIECES: Shape[] = [
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
];

const CAPTURED_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", "KeyX", "Space"]);

type Palette = {
  bg: string;
  grid: string;
  boardBorder: string;
  hudText: string;
  hudAccent: string;
  overlayTitle: string;
  overlaySub: string;
  pieces: Record<number, string>;
  blockHighlight: string;
  glow: boolean;
};

// clasico: valores originales del motor, copiados literales — línea base de regresión.
const CLASICO: Palette = {
  bg: "#07070d",
  grid: "rgba(74, 79, 112, 0.35)",
  boardBorder: "#4a4f70",
  hudText: "#e6e9ff",
  hudAccent: "#f5ff00",
  overlayTitle: "#ff006e",
  overlaySub: "rgba(138, 143, 181, 0.85)",
  pieces: {
    1: "#00f5ff", // I - cyan
    2: "#f5ff00", // O - yellow
    3: "#ff006e", // T - magenta
    4: "#00ff88", // S - green
    5: "#ff3b3b", // Z - red
    6: "#7c5cff", // J - indigo
    7: "#ff9500", // L - orange
  },
  blockHighlight: "rgba(255,255,255,0.12)",
  glow: false,
};

// neon: alto contraste sobre negro puro, glow vía shadowBlur, saturación de la paleta CRT (globals.css).
const NEON: Palette = {
  bg: "#000000",
  grid: "rgba(0, 245, 255, 0.18)",
  boardBorder: "#00f5ff",
  hudText: "#e6e9ff",
  hudAccent: "#f5ff00",
  overlayTitle: "#ff006e",
  overlaySub: "rgba(0, 245, 255, 0.65)",
  pieces: {
    1: "#00f5ff", // I - cyan
    2: "#f5ff00", // O - yellow
    3: "#ff006e", // T - magenta
    4: "#00ff88", // S - green
    5: "#ff3b3b", // Z - red
    6: "#ffcf3a", // J - gold
    7: "#ff9500", // L - orange
  },
  blockHighlight: "rgba(255,255,255,0.3)",
  glow: true,
};

// retro: fósforo limitado, 3-4 tonos monocromos, sin glow, bordes duros.
const RETRO: Palette = {
  bg: "#001100",
  grid: "rgba(0, 90, 40, 0.6)",
  boardBorder: "#33ff66",
  hudText: "#33ff66",
  hudAccent: "#aaffcc",
  overlayTitle: "#aaffcc",
  overlaySub: "#1f9b46",
  pieces: {
    1: "#1f9b46", // I
    2: "#aaffcc", // O
    3: "#33ff66", // T
    4: "#1f9b46", // S
    5: "#33ff66", // Z
    6: "#aaffcc", // J
    7: "#1f9b46", // L
  },
  blockHighlight: "transparent",
  glow: false,
};

const PALETTES: Record<SkinId, Palette> = {
  clasico: CLASICO,
  neon: NEON,
  retro: RETRO,
};

type InternalStatus = "playing" | "gameover";

type Piece = { shape: Shape; x: number; y: number };

function randomPiece(): Piece {
  const shape = PIECES[Math.floor(Math.random() * PIECES.length)].map((row) => [...row]);
  return {
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function rotateCW(shape: Shape): Shape {
  const rows = shape.length;
  const cols = shape[0].length;
  const result: Shape = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = shape[r][c];
    }
  }
  return result;
}

export const createTetrisEngine: GameEngineFactory = (canvas, onState, initialSkin) => {
  const ctxOrNull = canvas.getContext("2d");
  if (!ctxOrNull) throw new Error("2D context not available");
  const ctx = ctxOrNull;

  let skin: SkinId = normalizeSkin(initialSkin ?? DEFAULT_SKIN);
  let palette: Palette = PALETTES[skin];

  let board: number[][];
  let current: Piece;
  let next: Piece;
  let score: number;
  let lives: number;
  let lines: number;
  let level: number;
  let state: InternalStatus;
  let dropAccum: number;
  let dropInterval: number;

  let externalPaused = false;
  let rafId: number | null = null;
  let lastTime: number | null = null;

  function createBoard(): number[][] {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  }

  function collide(shape: Shape, ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function tryRotate() {
    const rotated = rotateCW(current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collide(rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        return;
      }
    }
  }

  function merge() {
    for (let r = 0; r < current.shape.length; r++) {
      for (let c = 0; c < current.shape[r].length; c++) {
        if (current.shape[r][c]) board[current.y + r][current.x + c] = current.shape[r][c];
      }
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v !== 0)) {
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      lines += cleared;
      score += (LINE_SCORES[cleared] || 0) * level;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(0.1, 1 - (level - 1) * 0.09);
    }
  }

  function ghostY(): number {
    let gy = current.y;
    while (!collide(current.shape, current.x, gy + 1)) gy++;
    return gy;
  }

  function endGame() {
    lives = 0;
    state = "gameover";
  }

  function spawn() {
    current = next;
    next = randomPiece();
    if (collide(current.shape, current.x, current.y)) endGame();
  }

  function lockPiece() {
    merge();
    clearLines();
    spawn();
  }

  function softDrop() {
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
      score += 1;
    } else {
      lockPiece();
    }
  }

  function hardDrop() {
    const gy = ghostY();
    score += (gy - current.y) * 2;
    current.y = gy;
    lockPiece();
  }

  function initGame() {
    board = createBoard();
    score = 0;
    lives = 1;
    lines = 0;
    level = 1;
    state = "playing";
    dropAccum = 0;
    dropInterval = 1;
    next = randomPiece();
    spawn();
  }

  function applyAction(code: string) {
    if (state !== "playing" || externalPaused) return;
    switch (code) {
      case "ArrowLeft":
        if (!collide(current.shape, current.x - 1, current.y)) current.x--;
        break;
      case "ArrowRight":
        if (!collide(current.shape, current.x + 1, current.y)) current.x++;
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate();
        break;
      case "Space":
        hardDrop();
        break;
    }
    maybeEmit();
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (CAPTURED_KEYS.has(e.code)) e.preventDefault();
    applyAction(e.code);
  };

  window.addEventListener("keydown", onKeyDown);

  const ACTION_TO_CODE: Partial<Record<ControlAction, string>> = {
    left: "ArrowLeft",
    right: "ArrowRight",
    down: "ArrowDown",
    a: "ArrowUp",
    b: "Space",
  };

  function update(dt: number) {
    if (state !== "playing") return;
    dropAccum += dt;
    if (dropAccum >= dropInterval) {
      dropAccum = 0;
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
      } else {
        lockPiece();
      }
    }
  }

  function drawBlock(x: number, y: number, colorIndex: number, size: number, alpha = 1) {
    if (!colorIndex) return;
    const color = palette.pieces[colorIndex];
    ctx.globalAlpha = alpha;
    if (palette.glow) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = color;
    }
    ctx.fillStyle = color;
    ctx.fillRect(BOARD_X + x * size + 1, BOARD_Y + y * size + 1, size - 2, size - 2);
    if (palette.glow) ctx.shadowBlur = 0;
    if (palette.blockHighlight !== "transparent") {
      ctx.fillStyle = palette.blockHighlight;
      ctx.fillRect(BOARD_X + x * size + 1, BOARD_Y + y * size + 1, size - 2, 4);
    }
    ctx.globalAlpha = 1;
  }

  function drawGrid() {
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X + c * BLOCK, BOARD_Y);
      ctx.lineTo(BOARD_X + c * BLOCK, BOARD_Y + ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_X, BOARD_Y + r * BLOCK);
      ctx.lineTo(BOARD_X + COLS * BLOCK, BOARD_Y + r * BLOCK);
      ctx.stroke();
    }
  }

  function drawBoard() {
    ctx.strokeStyle = palette.boardBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, COLS * BLOCK + 2, ROWS * BLOCK + 2);

    drawGrid();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) drawBlock(c, r, board[r][c], BLOCK);
    }

    const gy = ghostY();
    for (let r = 0; r < current.shape.length; r++) {
      for (let c = 0; c < current.shape[r].length; c++) {
        if (current.shape[r][c]) drawBlock(current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);
      }
    }

    for (let r = 0; r < current.shape.length; r++) {
      for (let c = 0; c < current.shape[r].length; c++) {
        drawBlock(current.x + c, current.y + r, current.shape[r][c], BLOCK);
      }
    }
  }

  function drawNextPreview(px: number, py: number) {
    const NB = 20;
    const shape = next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        ctx.fillStyle = palette.pieces[shape[r][c]];
        ctx.fillRect(px + (offX + c) * NB + 1, py + (offY + r) * NB + 1, NB - 2, NB - 2);
      }
    }
  }

  function drawPanel() {
    ctx.textAlign = "left";
    ctx.fillStyle = palette.hudText;
    ctx.font = "14px monospace";

    ctx.fillText("SIGUIENTE", PANEL_X, BOARD_Y + 24);
    ctx.strokeStyle = palette.boardBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PANEL_X, BOARD_Y + 36, 80, 80);
    drawNextPreview(PANEL_X, BOARD_Y + 36);

    ctx.fillStyle = palette.hudText;
    ctx.fillText("LÍNEAS", PANEL_X, BOARD_Y + 150);
    ctx.fillStyle = palette.hudAccent;
    ctx.font = "bold 20px monospace";
    ctx.fillText(String(lines), PANEL_X, BOARD_Y + 176);

    ctx.fillStyle = palette.hudText;
    ctx.font = "14px monospace";
    ctx.fillText("NIVEL", PANEL_X, BOARD_Y + 210);
    ctx.fillStyle = palette.hudAccent;
    ctx.font = "bold 20px monospace";
    ctx.fillText(String(level), PANEL_X, BOARD_Y + 236);

    ctx.textAlign = "center";
    ctx.fillStyle = palette.hudText;
    ctx.font = "bold 16px monospace";
    ctx.save();
    ctx.translate(125, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("TETRIS", 0, 0);
    ctx.restore();
  }

  function drawOverlay(title: string, sub: string) {
    ctx.textAlign = "center";
    ctx.fillStyle = palette.overlayTitle;
    ctx.font = "bold 46px monospace";
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.font = "18px monospace";
    ctx.fillStyle = palette.overlaySub;
    ctx.fillText(sub, W / 2, H / 2 + 22);
  }

  function draw() {
    ctx.shadowBlur = 0;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);

    drawBoard();
    drawPanel();

    if (state === "gameover") drawOverlay("GAME OVER", `PUNTAJE: ${score}`);
  }

  let lastEmitted: EngineState | null = null;
  function maybeEmit() {
    const nextState: EngineState = {
      score,
      lives,
      level,
      status: externalPaused ? "paused" : state,
    };
    if (
      !lastEmitted ||
      lastEmitted.score !== nextState.score ||
      lastEmitted.lives !== nextState.lives ||
      lastEmitted.level !== nextState.level ||
      lastEmitted.status !== nextState.status
    ) {
      lastEmitted = nextState;
      onState(nextState);
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
      applyAction(code);
    },
  };

  return engine;
};
