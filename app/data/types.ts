export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string; // "bloque-buster"
  title: string; // "BLOQUE BUSTER"
  short: string; // texto de card
  long: string; // texto de detalle
  cat: GameCategory;
  cover: string; // clase CSS: "cover-bricks" | ...
  color: GameColor; // variante de botón
  best: number;
  plays: string; // "12.4K"
};

export type ScoreRow = { rank: number; name: string; score: number; date: string };
export type SessionUser = { name: string };
